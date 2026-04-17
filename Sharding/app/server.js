const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes'); // Dummy
const userRoutes = require('./routes/userRoutes'); // Dummy
const messRoutes = require('./routes/messRoutes'); // Dummy
const feedbackRoutes = require('./routes/feedbackRoutes'); // Dummy
const adminRoutes = require('./routes/adminRoutes'); // Dummy

app.use(express.json());

// Existing routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', messRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// Add these 2 lines with your other route imports
const shardRoutes = require('./routes/shardRoutes');

// Add this line with your other app.use() calls
app.use('/api', shardRoutes);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
