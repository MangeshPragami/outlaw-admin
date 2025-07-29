    // backend/src/api/users/user.controller.js
    import { query } from '../../config/database.js';

    // Get all users with their profile information
    export const getAllUsers = async (req, res) => {
      try {
        const result = await query(`
          SELECT
            u.id, u.email, u.persona_type, u.created_at, u.email_verified_at,
            ui.name, ui.profile_title, ui.country, ui.industry, ui.age, ui.linkedin
          FROM users u
          LEFT JOIN user_information ui ON u.id = ui.user_id
          ORDER BY u.created_at DESC
        `);
        // We will add an 'isApproved' field based on your logic later.
        // For now, let's assume it's based on email verification.
        const usersWithApproval = result.rows.map(u => ({...u, isApproved: !!u.email_verified_at}));
        res.status(200).json(usersWithApproval);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users.' });
      }
    };

    // Approve a single user (e.g., by setting their email_verified_at timestamp)
    export const approveUser = async (req, res) => {
        const { id } = req.params;
        try {
            await query("UPDATE users SET email_verified_at = NOW() WHERE id = $1", [id]);
            res.status(200).json({ message: `User ${id} approved successfully.` });
        } catch (error) {
            console.error(`Error approving user ${id}:`, error);
            res.status(500).json({ message: 'Server error while approving user.' });
        }
    };
    