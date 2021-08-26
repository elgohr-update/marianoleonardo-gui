import React, { Fragment, useEffect, useState } from 'react';
import moment from 'moment';
import historyManager from 'Comms/devices/HistoryManager';
import PropTypes from 'prop-types';
import { DojotCustomButton } from 'Components/DojotButton';
import { ExportToCsv } from 'export-to-csv';
import toaster from 'Comms/util/materialize';
import ReportTable from './ReportPage.js';

const extractAttrsLabels = (listAttrDySelected) => (listAttrDySelected.map((attr) => attr.label));

const getCsvConfig = (deviceId, dateFrom, dateTo) => {
    const shortFrom = moment(dateFrom).format('DD-MM-HHmm');
    const shortTo = moment(dateTo).format('DD-MM-HHmm');

    return {
        fieldSeparator: ',',
        showLabels: true,
        filename: `export_${deviceId}_${shortFrom}_to_${shortTo}`,
        useBom: true,
        useKeysAsHeaders: true,
        useTextFile: false,
    };
};

const datetimeLocalFormat = (t) => moment(t).format('YYYY-MM-DDThh:mm');

const datetimeUTC = (t) => moment(t).utc().format('YYYY-MM-DDTHH:mm');

const ReportComponent = ({
    deviceId, deviceLabel,
    listAttrDySelected, t,
}) => {
    const [openHtml, setOpenHtml] = useState(false);
    const [loadedData, setLoadedData] = useState(false);

    const current = new Date();
    const prior = new Date().setDate(current.getDate() - 30);
    const [dateFrom, setDateFrom] = useState(datetimeLocalFormat(prior));
    const [dateTo, setDateTo] = useState(datetimeLocalFormat(current));
    const [rows, setRows] = useState([]);

    useEffect(() => {
        setLoadedData(false);
    }, [listAttrDySelected]);

    const changeDateTo = (e) => {
        const { value } = e.target;
        setDateTo(value);
    };

    const changeDateFrom = (e) => {
        const { value } = e.target;
        setDateFrom(value);
    };

    const checkSanity = () => {
        if (listAttrDySelected.length === 0) {
            toaster.warning(t('report:alerts.select_dy'));
            return false;
        }

        if (dateFrom === '') {
            toaster.warning(t('report:alerts.datefrom_miss'));
            return false;
        }

        if (dateTo === '') {
            toaster.warning(t('report:alerts.dateto_miss'));
            return false;
        }

        const dateFromDate = new Date(dateFrom);
        const dateToDate = new Date(dateTo);

        if (dateFromDate.toString() === 'Invalid Date') {
            toaster.error(t('report:alerts.datefrom_invalid'));
            return false;
        }

        if (dateToDate.toString() === 'Invalid Date') {
            toaster.error(t('report:alerts.dateto_invalid'));
            return false;
        }

        if (dateFromDate.getTime() >= dateToDate.getTime()) {
            toaster.warning(t('report:alerts.datafrom_greanter_dateto'));
            return false;
        }
        return true;
    };

    const generateData = () => {
        if (!checkSanity()) return;
        setLoadedData(false);
        const attrs = extractAttrsLabels(listAttrDySelected);
        attrs.push('_'); // workaround to always request 2 attrs
        const mergedAttr = attrs.join('&attr=');

        historyManager.getHistory(
            deviceId,
            mergedAttr,
            datetimeUTC(dateFrom),
            datetimeUTC(dateTo),
        ).then((result) => {
            const { _, ...rws } = result; // removing the workaround
            setRows(rws);
            setLoadedData(true);
        }).catch(() => {
            setRows([]);
            toaster.warning(t('report:reports.not_found'));
        });
    };

    const openCsv = () => {
        const newTable = [];
        // creates a column list from attr list
        const columns = extractAttrsLabels(listAttrDySelected);

        // if there is no data
        const rowsAsList = Object.values(rows).flat();
        if (!rowsAsList.length) return;

        // creates a empty row
        const emptyRow = { ts: '' };
        columns.forEach((column) => {
            emptyRow[column] = '';
        });

        // creates a object with all timestamps and sets the attrs that matches with them
        const tsList = {};
        rowsAsList.forEach((line) => {
            const nwLne = { attr: line.attr, value: line.value };
            if (!tsList[line.ts]) {
                tsList[line.ts] = [];
            }
            tsList[line.ts].push(nwLne);
        });

        // create table
        Object.entries(tsList).forEach(([ts, attrs]) => {
            // cloning a empty line with all attributes
            const newLine = JSON.parse(JSON.stringify(emptyRow));
            newLine.ts = ts;
            attrs.forEach((myattr) => {
                newLine[myattr.attr] = myattr.value;
            });
            newTable.push(newLine);
        });

        // export to CSV
        try {
            const csvExporter = new ExportToCsv(getCsvConfig(deviceId, dateFrom, dateTo));
            csvExporter.generateCsv(newTable);
        } catch (error) {
            toaster.warning(error);
        }
    };

    return (
        <div className="report col s9">
            <span className="report-label">
                {t('report:title')}
            </span>
            <span>
                <input
                    name="dateFrom"
                    type="datetime-local"
                    defaultValue={dateFrom}
                    onChange={changeDateFrom}
                    max={dateTo}
                />
            </span>
            <span className="to-middle">
                {t('report:to')}
            </span>
            <span>
                <input
                    name="dateTo"
                    type="datetime-local"
                    defaultValue={dateTo}
                    onChange={changeDateTo}
                    min={dateFrom}
                    max={datetimeLocalFormat(new Date())}
                />
            </span>
            <span>
                <DojotCustomButton
                    label={t('report:generate')}
                    onClick={generateData}
                />
            </span>
            {loadedData ? (
                <Fragment>
                    <span>
                        <DojotCustomButton
                            label={t('report:html')}
                            onClick={() => setOpenHtml(true)}
                        />
                    </span>
                    <span>
                        <DojotCustomButton
                            label={t('report:csv')}
                            onClick={openCsv}
                        />
                    </span>
                </Fragment>
            ) : null}
            {openHtml ? (
                <ReportTable
                    checkClose={() => setOpenHtml(false)}
                    deviceLabel={deviceLabel}
                    rows={rows}
                    deviceId={deviceId}
                    t={t}
                />
            ) : <div />}
        </div>
    );
};

ReportComponent.defaultProps = {
    listAttrDySelected: [],
};

ReportComponent.propTypes = {
    deviceLabel: PropTypes.string.isRequired,
    deviceId: PropTypes.string.isRequired,
    listAttrDySelected: PropTypes.arrayOf(PropTypes.shape({})),
    t: PropTypes.func.isRequired,
};

export default ReportComponent;
