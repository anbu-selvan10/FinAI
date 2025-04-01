const User = require('../users/users.model');
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const moment = require('moment');

const getMissingExpenseDates = async (req, res) => {
    try {
        const { email, currentDate } = req.query;
        
        if (!email || !currentDate) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email and current date are required' 
          });
        }
    
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
          });
        }
    
        const username = user.userName;
        
        const endDate = moment(currentDate);
        const startDate = moment(currentDate).subtract(30, 'days');
        
        const allDates = [];
        let currentDateInLoop = startDate.clone();
        
        while (currentDateInLoop.isSameOrBefore(endDate)) {
          allDates.push(currentDateInLoop.format('YYYY-MM-DD'));
          currentDateInLoop.add(1, 'days');
        }
        
        const { data: expenseData, error } = await supabase
          .from('expenses')
          .select('date')
          .eq('username', username)
          .gte('date', startDate.format('YYYY-MM-DD'))
          .lte('date', endDate.format('YYYY-MM-DD'));
        
        if (error) {
          console.error('Supabase query error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Error querying expense data', 
            details: error.message 
          });
        }
        
        const recordedDates = new Set();
        
        if (expenseData && Array.isArray(expenseData)) {
          expenseData.forEach(record => {
            if (record.date) {
              const formattedDate = moment(record.date).format('YYYY-MM-DD');
              recordedDates.add(formattedDate);
            }
          });
        }
        
        const missingDates = allDates.filter(date => !recordedDates.has(date));
        
        return res.status(200).json({
          success: true,
          missingDates,
          totalMissing: missingDates.length
        });
        
      } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Server error while fetching missing expense dates',
          details: error.message
        });
      }
    };

  module.exports = { getMissingExpenseDates }