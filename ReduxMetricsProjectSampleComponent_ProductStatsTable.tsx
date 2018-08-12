/// <reference path="../../../../../typings/react/react.d.ts" />
/// <reference path="../../../../../typings/lodash/lodash.d.ts" />

import * as React from 'react';

const _map: typeof _.map = require('lodash.map');

import { Table, TableData, Column } from '../Table';
import { formatCell } from '../../Table/Common';
import { store as metricStore } from '../../../data/stores/MetricStore';
import { Metrics, Trends } from '../../../../../models/Metrics';
import { ChartType, getTypes, getName, getTooltip, getDescriptor, formatPercent } from '../../../models/Chart';
import { getDateRangeFilterName, DateRangeFilterType } from '../../../models/DateRangeFilter';
import { Chart } from '../../Chart/FinancialEventChart';
import { Trend, DisplayMode } from '../../Trend/Trend';
import { generateProductStatsCSV } from '../../../CSVUtil';
import { isSelectedDateRangeSingleDay } from '../../../models/DateRangeFilter';

interface Props extends React.Props<ProductStatsTable> {
    sku: string;
}

interface State {
    metrics: Metrics;
    trendMetrics: Metrics;
    trends: Trends;
}

function composeState(): State {
    return {
        metrics: metricStore.getMetrics(),
        trendMetrics: metricStore.getTrendMetrics(),
        trends: metricStore.getTrends()
    };
}

const REF_TABLE = 'REF_TABLE';

export class ProductStatsTable extends React.Component<Props, State> {
    state = composeState();

    componentDidMount() {
        metricStore.addChangeListener(this.onStoreChange);
    }

    componentWillUnmount() {
        metricStore.removeChangeListener(this.onStoreChange);
    }

    private onStoreChange = (() => { this.setState(composeState()); }).bind(this);

    render() {
        return <Table data={this.getData()} includeTotal={false} isZoomable={true} isEmbedded={true} ref={REF_TABLE} />
    }

    generateCSV() {
        return generateProductStatsCSV((this.refs[REF_TABLE] as Table).getColumns());
    }

    private getData(): TableData {
        const types = getTypes();
        const trendValues = _map(types, type => ({ type, value: this.getTrendValue(type) }));

        let columns: TableData = [
            {
                title: 'Metric',
                values: _map(types, (type, index) => ({ index, value: getName(type), tooltip: getTooltip(type) })),
                isPinned: true
            },
            {
                title: getDateRangeFilterName(DateRangeFilterType.Principal),
                values: _map(types, (type, index) => ({ index, value: this.getSumCell(type, 'metrics') })),
                textValueFormatter: (value, index) => {
                    const type = types[index];
                    return getDescriptor(type).formatter(this.getSum(type, 'metrics'));
                },
                isSortable: false,
                isNumeric: true
            },
            {
                title: getDateRangeFilterName(DateRangeFilterType.Trend),
                values: _map(types, (type, index) => ({ index, value: this.getSumCell(type, 'trendMetrics') })),
                textValueFormatter: (value, index) => {
                    const type = types[index];
                    return getDescriptor(type).formatter(this.getSum(type, 'trendMetrics'));
                },
                isSortable: false,
                isNumeric: true
            },
            {
                title: 'Change',
                values: _map(types, (type, index) => ({ index, type, value: this.getTrendValue(type) })),
                textValueFormatter: formatPercent,
                domValueFormatter: (item: any) => {
                    const isNegativeGood = getDescriptor(item.type).isNegativeGood;

                    return (
                        <div className="mm-table-trend-cell">
                            <Trend value={item.value} isNegativeGood={isNegativeGood} displayMode={DisplayMode.Percentage} />
                            <Trend value={item.value} isNegativeGood={isNegativeGood} displayMode={DisplayMode.Icon} />
                        </div>
                    );
                },
                domValueUnwrapped: true,
                isNumeric: true
            }
        ];

        if (!isSelectedDateRangeSingleDay()) {
            columns.push({
                title: 'Trend',
                values: _map(types, (type, index) => {
                    const descriptor = getDescriptor(type);
                    return {
                        index,
                        value: <Chart bare={true}
                                    timestampRangeGetter={descriptor.get.metrics.timestampRange}
                                    timestampsGetter={descriptor.get.metrics.timestamps}
                                    valueRangeGetter={() => descriptor.get.metrics.sumBySKUValueRange(this.props.sku)}
                                    valueGetter={(index) => descriptor.get.metrics.sumBySKUValue(index, this.props.sku)}
                                    sumsGetter={descriptor.get.metrics.sums} />
                    };
                }),
                isSortable: false,
                isChart: true
            });

            columns.push({
                title: 'TrendEmbedded',
                values: _map(types, (type, index) => {
                    const descriptor = getDescriptor(type);
                    return {
                        index,
                        value: <Chart bare={false}
                                    timestampRangeGetter={descriptor.get.metrics.timestampRange}
                                    timestampsGetter={descriptor.get.metrics.timestamps}
                                    valueRangeGetter={() => descriptor.get.metrics.sumBySKUValueRange(this.props.sku)}
                                    valueGetter={(index) => descriptor.get.metrics.sumBySKUValue(index, this.props.sku)}
                                    sumsGetter={descriptor.get.metrics.sums}
                                    formatter={descriptor.formatter}
                                    showTooltipItems={false} />
                    };
                }),
                isSortable: false,
                isChart: false,
                isEmbedded: true
            });
        }

        return columns;
    }

    private getSum(type: ChartType, metrics: string) {
        const descriptor = getDescriptor(type);
        return descriptor.get[metrics].sumBySKU(this.props.sku);
    }

    private getSumCell(type: ChartType, metrics: string) {
        return formatCell(type, this.getSum(type, metrics));
    }

    private getTrendValue(type: ChartType) {
        return getDescriptor(type).get.trends.sumBySKU(this.props.sku);
    }
}
