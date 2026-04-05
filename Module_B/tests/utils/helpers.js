const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

// Credentials
const ADMIN_CREDENTIALS = { email: 'admin@iitgn.ac.in', password: 'admin123' };
const STUDENT_CREDENTIALS = { email: 'student', password: 'student123' };

let adminToken = null;
let studentToken = null;

async function getAdminToken() {
    if (adminToken) return adminToken;
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
        adminToken = response.data.token;
        return adminToken;
    } catch (error) {
        console.error('Failed to get admin token:', error.response?.data || error.message);
        throw error;
    }
}

async function getStudentToken() {
    if (studentToken) return studentToken;
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, STUDENT_CREDENTIALS);
        studentToken = response.data.token;
        return studentToken;
    } catch (error) {
        console.error('Failed to get student token:', error.response?.data || error.message);
        throw error;
    }
}

async function apiCall(method, endpoint, dataOrToken = null, token = null) {
    const headers = {};
    
    // Handle different calling patterns:
    // apiCall('GET', '/users/1', token) - token as 3rd param for GET requests
    // apiCall('POST', '/feedback', token, data) - token as 3rd param, data as 4th
    // apiCall('PUT', '/messes/1', {capacity: 100}, token) - data as 3rd, token as 4th
    let finalData = null;
    let finalToken = null;
    
    if (method === 'GET' || method === 'DELETE') {
        // For GET/DELETE, if 3rd param is a string, treat it as token
        if (typeof dataOrToken === 'string') {
            finalToken = dataOrToken;
        } else {
            finalData = dataOrToken;
            finalToken = token;
        }
    } else if (method === 'POST' || method === 'PUT') {
        // For POST/PUT, check if 3rd param looks like a token
        if (typeof dataOrToken === 'string' && dataOrToken.length > 20) {
            // Likely a token
            finalToken = dataOrToken;
            finalData = token;
        } else {
            // Normal case
            finalData = dataOrToken;
            finalToken = token;
        }
    }
    
    if (finalToken) {
        headers['Authorization'] = `Bearer ${finalToken}`;
    }

    const start = Date.now();
    try {
        const response = await axios({
            method,
            url: `${BASE_URL}${endpoint}`,
            data: finalData,
            headers,
            validateStatus: () => true  // Don't throw on any status
        });
        const duration = Date.now() - start;
        return { success: response.status >= 200 && response.status < 300, data: response.data, status: response.status, duration };
    } catch (error) {
        const duration = Date.now() - start;
        return { 
            success: false, 
            error: error.response?.data || error.message, 
            status: error.response?.status, 
            duration 
        };
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function saveResults(filename, results) {
    const resultsDir = path.join(__dirname, '..', 'results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    const filePath = path.join(resultsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${filePath}`);
}

function printSummary(testName, results) {
    console.log(`\n--- ${testName} Summary ---`);
    const total = results.length;
    const successCount = results.filter(r => r.success).length;
    const failCount = total - successCount;
    const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / total;

    console.log(`Total Requests: ${total}`);
    console.log(`Successes: ${successCount}`);
    console.log(`Failures: ${failCount}`);
    console.log(`Avg Duration: ${avgDuration.toFixed(2)}ms`);
    console.log('---------------------------\n');
}

module.exports = {
    getAdminToken,
    getStudentToken,
    apiCall,
    sleep,
    saveResults,
    printSummary,
    BASE_URL
};
