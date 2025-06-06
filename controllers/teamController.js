const supabase = require("../config/supabaseClient");




const createTeam = async (req, res) => {
  const userId = req.user.id;

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Team name is required.' });
  }

  try {
    // Step 0: Check if the user is already part of a team
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.team_id) {
      return res.status(403).json({ error: 'You are already part of a team.' });
    }

    // Step 1: Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        created_by: userId,
        storage_quota: 0,
        sso_enabled: false,
      })
      .select()
      .single();

    if (teamError) {
      return res.status(500).json({ error: 'Failed to create team.' });
    }

    // Step 2: Assign user to the new team
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ team_id: team.id })
      .eq('id', userId);

    if (profileError) {
      return res
        .status(500)
        .json({ error: 'Team created but failed to assign team to user.' });
    }

    return res.status(201).json({ message: 'Team created successfully.', team });
  } catch (err) {
    console.error('Team creation error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};



const addToTeam = async (req, res) => {
    const adminUserId = req.user.id;
    const { targetUserId, team_id } = req.body;

    if (!team_id || !targetUserId) {
        return res.status(400).json({ message: 'Team ID and target user ID are required.' });
    }

    try {
        // Step 1: Fetch the team and verify ownership
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, created_by')
            .eq('id', team_id)
            .single();

        if (teamError || !team) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        if (team.created_by !== adminUserId) {
            return res.status(403).json({ message: 'You are not authorized to add users to this team.' });
        }

        // Step 2: Update the target user's profile with the team_id
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ team_id })
            .eq('id', targetUserId);

        if (updateError) {
            console.error('Error adding user to team:', updateError);
            return res.status(500).json({ message: 'Failed to add user to team.' });
        }

        return res.status(200).json({ message: 'User added to the team successfully.' });
    } catch (err) {
        console.error("Adding user to team error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
}




module.exports = {
    createTeam,
    addToTeam,
};
