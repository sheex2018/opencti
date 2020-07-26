import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import inject18n from '../../../../components/i18n';
import XOpenctiIncidentOverview from './XOpenctiXOpenctiIncidentOverview';
import XOpenctiIncidentDetails from './XOpenctiXOpenctiIncidentDetails';
import XOpenctiIncidentEdition from './XOpenctiXOpenctiIncidentEdition';
import XOpenctiIncidentPopover from './XOpenctiXOpenctiIncidentPopover';
import EntityLastReports from '../../reports/EntityLastReports';
import EntityReportsChart from '../../reports/EntityReportsChart';
import EntityStixCoreRelationshipsDonut from '../../common/stix_core_relationships/EntityStixCoreRelationshipsDonut';
import StixDomainObjectHeader from '../../common/stix_domain_objects/StixDomainObjectHeader';
import Security, { KNOWLEDGE_KNUPDATE } from '../../../../utils/Security';
import StixCoreObjectNotes from '../../common/stix_core_object/StixCoreObjectNotes';

const styles = () => ({
  container: {
    margin: 0,
  },
  gridContainer: {
    marginBottom: 20,
  },
});

class XOpenctiIncidentComponent extends Component {
  render() {
    const { classes, xOpenctiIncident } = this.props;
    return (
      <div className={classes.container}>
        <StixDomainObjectHeader
          stixDomainObject={xOpenctiIncident}
          PopoverComponent={<XOpenctiIncidentPopover />}
        />
        <Grid
          container={true}
          spacing={3}
          classes={{ container: classes.gridContainer }}
        >
          <Grid item={true} xs={3}>
            <XOpenctiIncidentOverview xOpenctiIncident={xOpenctiIncident} />
          </Grid>
          <Grid item={true} xs={3}>
            <XOpenctiIncidentDetails xOpenctiIncident={xOpenctiIncident} />
          </Grid>
          <Grid item={true} xs={6}>
            <EntityLastReports entityId={xOpenctiIncident.id} />
          </Grid>
        </Grid>
        <StixCoreObjectNotes entityId={xOpenctiIncident.id} />
        <Grid
          container={true}
          spacing={3}
          classes={{ container: classes.gridContainer }}
          style={{ marginTop: 15 }}
        >
          <Grid item={true} xs={6}>
            <EntityStixCoreRelationshipsDonut
              entityId={xOpenctiIncident.id}
              entityType="Stix-Observable"
              relationship_type="related-to"
              field="entity_type"
            />
          </Grid>
          <Grid item={true} xs={6}>
            <EntityReportsChart entityId={xOpenctiIncident.id} />
          </Grid>
        </Grid>
        <Security needs={[KNOWLEDGE_KNUPDATE]}>
          <XOpenctiIncidentEdition xOpenctiIncidentId={xOpenctiIncident.id} />
        </Security>
      </div>
    );
  }
}

XOpenctiIncidentComponent.propTypes = {
  xOpenctiIncident: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
};

const XOpenctiXOpenctiIncident = createFragmentContainer(
  XOpenctiIncidentComponent,
  {
    xOpenctiIncident: graphql`
      fragment XOpenctiIncident_xOpenctiIncident on XOpenctiIncident {
        id
        name
        aliases
        ...XOpenctiIncidentOverview_xOpenctiIncident
        ...XOpenctiIncidentDetails_xOpenctiIncident
      }
    `,
  },
);

export default compose(inject18n, withStyles(styles))(XOpenctiXOpenctiIncident);