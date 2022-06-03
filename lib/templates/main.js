const mtop = require("@ali/tnode/kit/mtop")

module.exports = {
    oncreate(event) {
        mtop.request({
            api: 'mtop.fortress.csp.aggregate',
            v: '1.0',
            data: {
                env: 1,
                cspId: 111501,
                params: '{"nodeId": "95691668834"}',
            },
            ecode: 0,
            type: 'GET',
            timeout: 5000
        }, (data) => {
            event.data = data.data
            event.commit()
        }, (error) => {
            console.log(error)
        });
    },

    onloading(event) {
        mtop.request({
            api: 'mtop.fortress.csp.aggregate',
            v: '1.0',
            data: {
                env: 1,
                cspId: 111501,
                params: '{"nodeId": "95691668834"}',
            },
            ecode: 0,
            type: 'GET',
            timeout: 5000
        }, (data) => {
            var newData = data.data;
            event.data.list = event.data.list.concat(newData.list);
            event.commit()
        }, (error) => {
            console.log(error)
        });
    },

    onrefresh(event) {
        mtop.request({
            api: 'mtop.fortress.csp.aggregate',
            v: '1.0',
            data: {
                env: 1,
                cspId: 111501,
                params: '{"nodeId": "95691668834"}',
            },
            ecode: 0,
            type: 'GET',
            timeout: 5000
        }, (data) => {
            var newData = data.data;
            event.data = newData
            event.commit();
        }, (error) => {
            console.log(error)
        });
    }
}