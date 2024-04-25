const sql = require('../config/vacCenterDB');

//constructor

const vacCenter = function(vacCenter) {
    this.id = vacCenter.id;
    this.name = vacCenter.name;
    this.tel = vacCenter.tel;
};


vacCenter.getAll = result => {
    sql.query("SELECT * FROM vacCenters;", (err, res) => {
        if(err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        console.log("vacCenters: ", res);
        result(null, res);
    });
};

module.exports = vacCenter;