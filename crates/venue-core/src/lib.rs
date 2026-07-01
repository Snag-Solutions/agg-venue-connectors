use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

pub type ConnectorResult<T> = Result<T, ConnectorError>;

#[derive(Debug, Error)]
pub enum ConnectorError {
    #[error("unsupported connector capability: {0}")]
    Unsupported(&'static str),
    #[error("invalid connector data: {0}")]
    InvalidData(String),
    #[error("transport error: {0}")]
    Transport(String),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MarketDescriptor {
    pub venue: String,
    pub market_id: String,
    pub outcome_ids: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChartInterval {
    #[serde(rename = "1m")]
    OneMinute,
    #[serde(rename = "5m")]
    FiveMinutes,
    #[serde(rename = "15m")]
    FifteenMinutes,
    #[serde(rename = "1h")]
    OneHour,
    #[serde(rename = "1d")]
    OneDay,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChartCacheStatus {
    Fresh,
    Stale,
    Miss,
    Busy,
    Unsupported,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OrderbookLevel {
    pub price: f64,
    pub size: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OrderbookSnapshot {
    pub venue: String,
    pub market_id: String,
    pub outcome_id: String,
    pub bids: Vec<OrderbookLevel>,
    pub asks: Vec<OrderbookLevel>,
    pub sequence: Option<u64>,
    pub timestamp_unix_ms: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ChartBarsRequest {
    pub market_identifier: String,
    pub interval: ChartInterval,
    pub start_unix_seconds: Option<i64>,
    pub end_unix_seconds: Option<i64>,
    pub count_back: Option<usize>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ChartBar {
    pub timestamp_unix_seconds: i64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ChartBarsFetch {
    pub bars: Vec<ChartBar>,
    pub cache_status: ChartCacheStatus,
}

#[async_trait]
pub trait VenueConnector: Send + Sync {
    fn venue(&self) -> &str;

    async fn connect(&self) -> ConnectorResult<()> {
        Ok(())
    }

    async fn disconnect(&self) -> ConnectorResult<()> {
        Ok(())
    }

    async fn discover_events(&self) -> ConnectorResult<Vec<MarketDescriptor>> {
        Ok(Vec::new())
    }

    async fn fetch_orderbook_rest(
        &self,
        market_id: &str,
        outcome_id: &str,
    ) -> ConnectorResult<OrderbookSnapshot>;

    async fn fetch_chart_bars(
        &self,
        _request: ChartBarsRequest,
    ) -> ConnectorResult<ChartBarsFetch> {
        Err(ConnectorError::Unsupported("chart bars"))
    }
}

pub fn validate_orderbook_snapshot(snapshot: &OrderbookSnapshot) -> ConnectorResult<()> {
    if snapshot.venue.trim().is_empty() {
        return Err(ConnectorError::InvalidData("venue is required".into()));
    }
    if snapshot.market_id.trim().is_empty() {
        return Err(ConnectorError::InvalidData("market_id is required".into()));
    }
    if snapshot.outcome_id.trim().is_empty() {
        return Err(ConnectorError::InvalidData("outcome_id is required".into()));
    }

    validate_levels("bid", &snapshot.bids, SortOrder::Descending)?;
    validate_levels("ask", &snapshot.asks, SortOrder::Ascending)?;

    if let (Some(best_bid), Some(best_ask)) = (snapshot.bids.first(), snapshot.asks.first())
        && best_bid.price > best_ask.price
    {
        return Err(ConnectorError::InvalidData(format!(
            "crossed book: best bid {} is above best ask {}",
            best_bid.price, best_ask.price
        )));
    }

    Ok(())
}

pub fn validate_chart_bars(fetch: &ChartBarsFetch) -> ConnectorResult<()> {
    if fetch.cache_status == ChartCacheStatus::Unsupported && !fetch.bars.is_empty() {
        return Err(ConnectorError::InvalidData(
            "unsupported chart responses must not include bars".into(),
        ));
    }

    let mut previous_ts = None;
    for bar in &fetch.bars {
        if let Some(previous) = previous_ts
            && bar.timestamp_unix_seconds <= previous
        {
            return Err(ConnectorError::InvalidData(
                "chart bars must be sorted by increasing timestamp".into(),
            ));
        }
        previous_ts = Some(bar.timestamp_unix_seconds);

        for (name, value) in [
            ("open", bar.open),
            ("high", bar.high),
            ("low", bar.low),
            ("close", bar.close),
        ] {
            if !value.is_finite() || !(0.0..=1.0).contains(&value) {
                return Err(ConnectorError::InvalidData(format!(
                    "chart {name} must be a finite probability between 0 and 1"
                )));
            }
        }

        if bar.low > bar.high {
            return Err(ConnectorError::InvalidData(
                "chart low cannot be greater than high".into(),
            ));
        }
        if bar.open < bar.low || bar.open > bar.high || bar.close < bar.low || bar.close > bar.high
        {
            return Err(ConnectorError::InvalidData(
                "chart open/close must be inside low/high".into(),
            ));
        }
        if let Some(volume) = bar.volume
            && (!volume.is_finite() || volume < 0.0)
        {
            return Err(ConnectorError::InvalidData(
                "chart volume must be a non-negative finite number".into(),
            ));
        }
    }

    Ok(())
}

#[derive(Debug, Clone, Copy)]
enum SortOrder {
    Ascending,
    Descending,
}

fn validate_levels(
    label: &str,
    levels: &[OrderbookLevel],
    sort_order: SortOrder,
) -> ConnectorResult<()> {
    let mut previous_price = None;

    for level in levels {
        if !level.price.is_finite() || !(0.0..=1.0).contains(&level.price) {
            return Err(ConnectorError::InvalidData(format!(
                "{label} price must be a finite probability between 0 and 1"
            )));
        }
        if !level.size.is_finite() || level.size <= 0.0 {
            return Err(ConnectorError::InvalidData(format!(
                "{label} size must be a positive finite number"
            )));
        }

        if let Some(previous) = previous_price {
            match sort_order {
                SortOrder::Ascending if level.price < previous => {
                    return Err(ConnectorError::InvalidData(format!(
                        "{label} levels must be sorted ascending"
                    )));
                }
                SortOrder::Descending if level.price > previous => {
                    return Err(ConnectorError::InvalidData(format!(
                        "{label} levels must be sorted descending"
                    )));
                }
                _ => {}
            }
        }
        previous_price = Some(level.price);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_a_good_orderbook() {
        let snapshot = OrderbookSnapshot {
            venue: "example".into(),
            market_id: "m1".into(),
            outcome_id: "yes".into(),
            bids: vec![OrderbookLevel {
                price: 0.49,
                size: 10.0,
            }],
            asks: vec![OrderbookLevel {
                price: 0.51,
                size: 12.0,
            }],
            sequence: Some(1),
            timestamp_unix_ms: Some(1_700_000_000_000),
        };

        validate_orderbook_snapshot(&snapshot).unwrap();
    }

    #[test]
    fn rejects_unsorted_chart_bars() {
        let fetch = ChartBarsFetch {
            cache_status: ChartCacheStatus::Fresh,
            bars: vec![
                ChartBar {
                    timestamp_unix_seconds: 2,
                    open: 0.5,
                    high: 0.6,
                    low: 0.4,
                    close: 0.55,
                    volume: Some(1.0),
                },
                ChartBar {
                    timestamp_unix_seconds: 1,
                    open: 0.5,
                    high: 0.6,
                    low: 0.4,
                    close: 0.55,
                    volume: Some(1.0),
                },
            ],
        };

        assert!(validate_chart_bars(&fetch).is_err());
    }
}
