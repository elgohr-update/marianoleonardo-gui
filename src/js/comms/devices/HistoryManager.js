import { baseURL } from 'Src/config';
import util from '../util/util';

class HistoryManager {
    getLastAttrDataByDeviceIDAndAttrLabel(deviceId, attrLabel) {
        return util.GET(`${baseURL}history/device/${deviceId}/history?lastN=1&attr=${attrLabel}`);
    }

    getHistory(deviceId, attrLabel, dateFrom, dateTo) {
        return util.GET(`${baseURL}history/device/${deviceId}/history?attr=${attrLabel}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
    }
}

const historyManager = new HistoryManager();
export default historyManager;
