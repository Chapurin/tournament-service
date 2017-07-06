const express = require('express');
const router = express.Router();
const PlayerController = require('../controllers/PlayerController');
const TournamentController = require('../controllers/TournamentController');
const ResetDbController = require('../controllers/ResetDbController.js');


router.get('/fund', PlayerController.fund);
router.get('/take', PlayerController.takePoints);
router.get('/balance', PlayerController.getBalance);

router.get('/announceTournament', TournamentController.announceTournament);
router.get('/joinTournament', TournamentController.playersJoinTournament);
router.post('/resultTournament', TournamentController.setResultTournament);

router.get('/reset', ResetDbController.reset);


module.exports = router;
