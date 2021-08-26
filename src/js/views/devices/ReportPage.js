import React from 'react';
import NewWindow from 'react-new-window';
import PropTypes from 'prop-types';
import Table from '../../components/table/Table.jsx';

const ReportTable = ({
    deviceId, rows, t, deviceLabel, checkClose,
}) => (
    <div>
        <NewWindow title={`${deviceLabel} - ${deviceId}`} onUnload={checkClose}>
            <div className="ReportTitle">{`${deviceLabel} - ${deviceId}`}</div>
            {
                Object.keys(rows).map(
                    (value) => <Table key="tb-321" itemList={rows[value]} t={t} />,
                )
            }
        </NewWindow>
    </div>
);

ReportTable.propTypes = {
    checkClose: PropTypes.func.isRequired,
    deviceLabel: PropTypes.string.isRequired,
    deviceId: PropTypes.string.isRequired,
    rows: PropTypes.shape({}).isRequired,
    t: PropTypes.func.isRequired,
};

export default ReportTable;
