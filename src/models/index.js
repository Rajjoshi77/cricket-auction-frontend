
const pool = require('../config/db.config');

// Player model
class Player {
    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM players');
        return rows;
    }

    static async findByPk(id) {
        const [rows] = await pool.query('SELECT * FROM players WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(playerData) {
        try {
            const {
                first_name,
                last_name,
                age,
                country,
                role,
                specialization,
                base_price,
                status = 'available',
                profile_image_url = null
            } = playerData;

            // Convert types
            const parsedAge = parseInt(age, 10);
            const parsedBasePrice = parseFloat(base_price);

            // Additional validation
            if (isNaN(parsedAge) || parsedAge < 16 || parsedAge > 50) {
                throw new Error('Age must be between 16 and 50');
            }

            if (isNaN(parsedBasePrice) || parsedBasePrice < 100000) {
                throw new Error('Base price must be at least ₹100,000');
            }

            const [result] = await pool.query(
                `INSERT INTO players
                (first_name, last_name, age, country, role, specialization, base_price, status, profile_image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    first_name.trim(),
                    last_name.trim(),
                    parsedAge,
                    country.trim(),
                    role.toLowerCase(),
                    specialization.toLowerCase(),
                    parsedBasePrice,
                    status,
                    profile_image_url
                ]
            );

            const newPlayer = {
                id: result.insertId,
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                age: parsedAge,
                country: country.trim(),
                role: role.toLowerCase(),
                specialization: specialization.toLowerCase(),
                base_price: parsedBasePrice,
                status,
                profile_image_url
            };

            return newPlayer;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('A player with these details already exists');
            }
            throw error;
        }
    }

    static async update(id, playerData) {
        const {
            first_name,
            last_name,
            age,
            country,
            role,
            specialization,
            base_price,
            status,
            profile_image_url
        } = playerData;

        await pool.query(
            `UPDATE players SET
            first_name = ?,
            last_name = ?,
            age = ?,
            country = ?,
            role = ?,
            specialization = ?,
            base_price = ?,
            status = ?,
            profile_image_url = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [first_name, last_name, age, country, role, specialization, base_price, status, profile_image_url, id]
        );

        return this.findByPk(id);
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM players WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = {
    Player
};

