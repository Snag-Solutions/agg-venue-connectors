use venue_core::{
    ChartBarsRequest, ConnectorResult, VenueConnector, validate_chart_bars,
    validate_orderbook_snapshot,
};

#[derive(Debug, Clone)]
pub struct OrderbookConformanceCase {
    pub market_id: String,
    pub outcome_id: String,
}

#[derive(Debug, Clone)]
pub struct ChartConformanceCase {
    pub request: ChartBarsRequest,
}

pub async fn assert_orderbook_conformance<C>(
    connector: &C,
    case: OrderbookConformanceCase,
) -> ConnectorResult<()>
where
    C: VenueConnector,
{
    let snapshot = connector
        .fetch_orderbook_rest(&case.market_id, &case.outcome_id)
        .await?;
    validate_orderbook_snapshot(&snapshot)
}

pub async fn assert_chart_conformance<C>(
    connector: &C,
    case: ChartConformanceCase,
) -> ConnectorResult<()>
where
    C: VenueConnector,
{
    let fetch = connector.fetch_chart_bars(case.request).await?;
    validate_chart_bars(&fetch)
}

pub async fn assert_market_data_conformance<C>(
    connector: &C,
    orderbook_case: OrderbookConformanceCase,
    chart_case: Option<ChartConformanceCase>,
) -> ConnectorResult<()>
where
    C: VenueConnector,
{
    connector.connect().await?;
    assert_orderbook_conformance(connector, orderbook_case).await?;
    if let Some(case) = chart_case {
        assert_chart_conformance(connector, case).await?;
    }
    connector.disconnect().await
}
