const mysql = require('mysql2/promise');

const SHARD_CONFIG = [
    {
        shard_id : 0,
        host     : '10.0.116.184',
        port     : 3307,
        user     : 'Data_Hunters',
        password : 'password@123',
        database : 'Data_Hunters'
    },
    {
        shard_id : 1,
        host     : '10.0.116.184',
        port     : 3308,
        user     : 'Data_Hunters',
        password : 'password@123',
        database : 'Data_Hunters'
    },
    {
        shard_id : 2,
        host     : '10.0.116.184',
        port     : 3309,
        user     : 'Data_Hunters',
        password : 'password@123',
        database : 'Data_Hunters'
    }
];

// Pool per shard — reuse connections
const pools = SHARD_CONFIG.map(config =>
    mysql.createPool({
        host            : config.host,
        port            : config.port,
        user            : config.user,
        password        : config.password,
        database        : config.database,
        waitForConnections: true,
        connectionLimit : 5
    })
);

function getShardPool(shardId) {
    return pools[shardId];
}

function getShardId(student_id) {
    return parseInt(student_id) % 3;
}

module.exports = { getShardPool, getShardId, SHARD_CONFIG };