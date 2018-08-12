import React from 'react';
import {FormattedMessage} from 'react-intl';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import LinkAsync from '../../../presentation/LinkAsync';
import ErrorLoaderWrapper from '../../../presentation/ErrorLoaderWrapper';
import ResponsiveDialog from '../../../presentation/ResponsiveDialog';
import DonutChart from '../../../presentation/DonutChart';
import LabelText from './LabelText';
import {Wrap, Block, Row, Info, Score, Button, GoTo, TopUp, FullStats} from './styled';
import PicDiagram from './PicDiagram';

@inject('commonStore', 'statisticsStore', 'userStore')
@observer
class Stats extends React.Component {
  constructor(props, context) {
    super(props, context);
    if (props.commonStore.token) {
      this.loadStats();
    }
    reaction(
      () => props.commonStore.token,
      (token) => {
        if (token) {
          this.loadStats();
        }
      }
    );
  }

  state = {
    getRewardsOpened: false,
  };

  handleGetRewardsClose() {
    this.setState({getRewardsOpened: false});
  }

  getRewardsOpen() {
    this.setState({getRewardsOpened: true});
  }

  loadStats() {
    this.props.statisticsStore.loadBallance();
    this.props.statisticsStore.loadLevel();
    this.props.statisticsStore.loadDaysAndMultiplier();
  }

  render() {
    const {statisticsStore, userStore} = this.props;

    return (
      <Wrap id="StatsID">
        <GoTo className="startSimulation">
          <LinkAsync to="/simulation">
            <FormattedMessage id="app.startSimulation" />
          </LinkAsync>
        </GoTo>

        <Block>
          <Row>
            <ErrorLoaderWrapper valueToCheck={statisticsStore.increasingBallance}>
              <Score>
                {statisticsStore.increasingBallance}
                <span> SMQ</span>
              </Score>
            </ErrorLoaderWrapper>

            <TopUp>
              <LinkAsync to="/topup">
                <FormattedMessage id="app.topUp" />
              </LinkAsync>
            </TopUp>
          </Row>

          <Button onClick={this.getRewardsOpen.bind(this)}>
            <FormattedMessage id="app.getRewardsButton" />
          </Button>
          <ResponsiveDialog open={this.state.getRewardsOpened} handleClose={this.handleGetRewardsClose.bind(this)} />
        </Block>

        <DonutChart
          type="Statistics"
          percents={statisticsStore.levelPercents}
          level={statisticsStore.level}
          experience={statisticsStore.increasingExperiencePoints}
          noTransition={statisticsStore.noTransition}
        >
          <ErrorLoaderWrapper donut={true} valueToCheck={statisticsStore.level} />
        </DonutChart>
        <Info>
          <LabelText
            label={<FormattedMessage id="app.daysInARow" />}
            value={statisticsStore.daysInARow}
            experience={statisticsStore.multiplier}
            maxBadge={statisticsStore.maxExperience}
          />
          <LabelText
            label={<FormattedMessage id="app.innerTimeSimulation" />}
            value={userStore.tradingPeriodPassedFormatted.value}
            postfix={<FormattedMessage id={`app.${userStore.tradingPeriodPassedFormatted.type}`} />}
          />
          <LabelText
            label={<FormattedMessage id="app.simulationCompleted" />}
            value={userStore.tradingSessionsPassed}
          />
        </Info>
        <FullStats>
          <LinkAsync to="/statistics">
            <PicDiagram />
            <FormattedMessage id="app.fullStats" />
          </LinkAsync>
        </FullStats>
      </Wrap>
    );
  }
}

export default Stats;
