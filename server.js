const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "taskdb",
  password: "yourpassword",
  port: 5432
});

/* =============================
      TASK ENDPOINTS
============================= */

// GET ALL TASKS
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching tasks");
  }
});

// CREATE TASK
app.post('/tasks', async (req, res) => {
  const { title, description } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *",
      [title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating task");
  }
});

// UPDATE TASK
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const result = await pool.query(
      "UPDATE tasks SET title = $1, description = $2 WHERE id = $3 RETURNING *",
      [title, description, id]
    );

    if (result.rows.length === 0)
      return res.status(404).send("Task not found");

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating task");
  }
});

// DELETE TASK
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).send("Task not found");

    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting task");
  }
});


/* =============================
      GAME STATE ENDPOINTS
============================= */

const GAME_STATE_ID = 1;

// GET GAME STATE
app.get('/gamestate', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gamestate WHERE id = $1',
      [GAME_STATE_ID]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        player_progress_percentage: 50,
        level_index: 0,
        opponent_index: 0,
        current_streak: 0,
        total_completed_missions: 0,
        xp: 0,
        is_immune: false,
        rewards_state: []
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching game state");
  }
});

// SAVE GAME STATE (UPSERT)
app.post('/gamestate', async (req, res) => {
  const {
    player_progress_percentage,
    level_index,
    opponent_index,
    current_streak,
    total_completed_missions,
    xp,
    is_immune,
    rewards_state
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO gamestate 
      (id, player_progress_percentage, level_index, opponent_index, current_streak, total_completed_missions, xp, is_immune, rewards_state)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id)
      DO UPDATE SET 
        player_progress_percentage = $2,
        level_index = $3,
        opponent_index = $4,
        current_streak = $5,
        total_completed_missions = $6,
        xp = $7,
        is_immune = $8,
        rewards_state = $9
      RETURNING *`,
      [
        GAME_STATE_ID,
        player_progress_percentage,
        level_index,
        opponent_index,
        current_streak,
        total_completed_missions,
        xp,
        is_immune,
        rewards_state
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving game state");
  }
});


/* =============================
      START SERVER
============================= */
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
