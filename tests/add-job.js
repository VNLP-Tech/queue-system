const axios = require('axios');

axios.post('http://localhost:3000/jobs', {
    key: '1',
    data: 'ok',
});
axios.post('http://localhost:3000/jobs', {
    key: '2',
    data: 'ok',
    runAt: Date.now() + 30 * 1000,
});
axios.post('http://localhost:3000/jobs', {
    key: '3',
    data: 'ok',
});
axios.post('http://localhost:3000/jobs', {
    key: '4',
    data: 'ok',
});
axios.post('http://localhost:3000/jobs', {
    key: '5',
    data: 'ok',
});

axios.post('http://localhost:3000/jobs', {
    key: '1.1',
    data: 'ok',
});
axios.post('http://localhost:3000/jobs', {
    key: '2.1',
    data: 'ok',
});
axios.post('http://localhost:3000/jobs', {
    key: '3.1',
    data: 'ok',
});
axios.post('http://localhost:3000/jobs', {
    key: '4.1',
    data: 'ok',
});
axios.post('http://localhost:3000/jobs', {
    key: '5.1',
    data: 'ok',
});
