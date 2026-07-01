use async_trait::async_trait;
use venue_core::{
    ChartBar, ChartBarsFetch, ChartBarsRequest, ChartCacheStatus, ConnectorResult, OrderbookLevel,
    OrderbookSnapshot, VenueConnector,
};

#[derive(Debug, Default)]
pub struct ExampleConnector;

#[async_trait]
impl VenueConnector for ExampleConnector {
    fn venue(&self) -> &str {
        "example"
    }

    async fn fetch_orderbook_rest(
        &self,
        market_id: &str,
        outcome_id: &str,
    ) -> ConnectorResult<OrderbookSnapshot> {
        Ok(OrderbookSnapshot {
            venue: self.venue().to_string(),
            market_id: market_id.to_string(),
            outcome_id: outcome_id.to_string(),
            bids: vec![
                OrderbookLevel {
                    price: 0.49,
                    size: 10.0,
                },
                OrderbookLevel {
                    price: 0.48,
                    size: 8.0,
                },
            ],
            asks: vec![
                OrderbookLevel {
                    price: 0.51,
                    size: 12.0,
                },
                OrderbookLevel {
                    price: 0.52,
                    size: 6.0,
                },
            ],
            sequence: Some(1),
            timestamp_unix_ms: Some(1_700_000_000_000),
        })
    }

    async fn fetch_chart_bars(
        &self,
        _request: ChartBarsRequest,
    ) -> ConnectorResult<ChartBarsFetch> {
        Ok(ChartBarsFetch {
            cache_status: ChartCacheStatus::Fresh,
            bars: vec![
                ChartBar {
                    timestamp_unix_seconds: 1_700_000_000,
                    open: 0.50,
                    high: 0.55,
                    low: 0.48,
                    close: 0.52,
                    volume: Some(100.0),
                },
                ChartBar {
                    timestamp_unix_seconds: 1_700_003_600,
                    open: 0.52,
                    high: 0.56,
                    low: 0.50,
                    close: 0.53,
                    volume: Some(120.0),
                },
            ],
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use venue_core::{ChartBarsRequest, ChartInterval};
    use venue_core_testkit::{
        ChartConformanceCase, OrderbookConformanceCase, assert_market_data_conformance,
    };

    #[tokio::test]
    async fn example_connector_passes_market_data_conformance() {
        let connector = ExampleConnector;
        assert_market_data_conformance(
            &connector,
            OrderbookConformanceCase {
                market_id: "market-1".into(),
                outcome_id: "yes".into(),
            },
            Some(ChartConformanceCase {
                request: ChartBarsRequest {
                    market_identifier: "market-1".into(),
                    interval: ChartInterval::OneHour,
                    start_unix_seconds: None,
                    end_unix_seconds: None,
                    count_back: Some(24),
                },
            }),
        )
        .await
        .unwrap();
    }
}
