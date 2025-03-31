const portfolioSession = require('./portsession.model');
const User = require("../users/users.model");

const getUserPortfolioSessions = async (req, res) => {
    const { email } = req.query;
    try {
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const sessions = await portfolioSession
        .find({ user_id: user.userName || user._id })
        .lean()
        .sort({ updated_at: -1 });
      
      const formattedSessions = sessions.map(session => {
        return {
          session_id: session.session_id,
          user_id: session.user_id,
          // Keep the memory structure intact with runs inside it
          memory: {
            runs: (session.memory?.runs || []).map(run => {
              return {
                input: run.input || "",
                response: run.response || ""
              };
            })
          },
          question: session.question || "", // Include the original question if available
          created_at: session.created_at || Math.floor(Date.now() / 1000),
          updated_at: session.updated_at || Math.floor(Date.now() / 1000)
        };
      });
    
      return res.status(200).json(formattedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return res.status(500).json({ error: error.message });
    }
  };


const getUserPortfolioChat = async (req, res) => {
    try {
      const session_id = req.params.session_id;
      const { email } = req.query;
      
      console.log("Received request with:", { email, session_id });
      
      if (!session_id || !email) {
        return res.status(400).json({ error: 'Session ID and email are required' });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        console.error(`User not found for email: ${email}`);
        return res.status(404).json({ error: 'User not found' });
      }
  
      const session = await portfolioSession.findOne({
        session_id: session_id,
        user_id: user.userName,
      }).lean();
  
      console.log("Fetched session data:", JSON.stringify(session, null, 2));
  
      if (!session) {
        console.error(`Session not found for session_id: ${session_id} and user: ${user.userName}`);
        return res.status(404).json({ error: 'Session not found' });
      }
  
      res.json(session);
    } catch (error) {
      console.error('Error fetching session detail:', error);
      res.status(500).json({ error: 'Failed to fetch session detail' });
    }
  };

const checkSessionExists = async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      const session = await portfolioSession.findOne({ session_id: id });
      
      return res.status(200).json({ exists: !!session });
    } catch (error) {
      console.error('Error checking session ID:', error);
      return res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getUserPortfolioChat , getUserPortfolioSessions , checkSessionExists }


