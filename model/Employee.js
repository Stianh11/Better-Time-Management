const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    position: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    hireDate: {
        type: Date,
        required: true
    },
    timesheets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Timesheet'
    }],
    leaves: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leave'
    }]
});

module.exports = mongoose.model('Employee', employeeSchema);