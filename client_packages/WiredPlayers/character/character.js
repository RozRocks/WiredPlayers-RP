﻿let faceModel = {
	'firstHeadShape': 0, 'secondHeadShape': 0, 'firstSkinTone': 0, 'secondSkinTone': 0, 'headMix': 0.5, 'skinMix': 0.5, 'hairModel': 0, 'firstHairColor': 0, 'secondHairColor': 0,
	'beardModel': 0, 'bearColor': 0, 'chestModel': 0, 'chestColor': 0, 'blemishesModel': -1, 'ageingModel': -1, 'complexionModel': -1, 'sundamageModel': -1, 'frecklesModel': -1,
	'eyesColor': 0, 'eyebrowsModel': 0, 'eyebrowsColor': 0, 'makeupModel': -1, 'blushModel': -1, 'blushColor': 0, 'lipstickModel': -1, 'lipstickColor': 0, 'noseWidth': 0.0,
	'noseHeight': 0.0, 'noseLength': 0.0, 'noseBridge': 0.0, 'noseTip': 0.0, 'noseShift': 0.0, 'browHeight': 0.0, 'browWidth': 0.0, 'cheekboneHeight': 0.0, 'cheekboneWidth': 0.0,
	'cheeksWidth': 0.0, 'eyes': 0.0, 'lips': 0.0, 'jawWidth': 0.0, 'jawHeight': 0.0, 'chinLength': 0.0, 'chinPosition': 0.0, 'chinWidth': 0.0, 'chinShape': 0.0, 'neckWidth': 0.0
};

let camera = undefined;
let characters = undefined;

mp.events.add('showPlayerCharacters', (charactersJson) => {
	// Store account characters
	characters = charactersJson;

	// Show character list
	mp.events.call('createBrowser', ['package://WiredPlayers/statics/html/sideMenu.html', 'populateCharacterList', charactersJson]);
});

mp.events.add('loadCharacter', (characterName) => {
	// Destroy the menu
	mp.events.call('destroyBrowser');

	// Load the character
	mp.events.callRemote('loadCharacter', characterName);
});

mp.events.add('showCharacterCreationMenu', () => {
	// Destroy the menu
	mp.events.call('destroyBrowser');

	// Initialize the character creation
	mp.events.callRemote('setCharacterIntoCreator');
	initializeCharacterCreation(mp.players.local);

	// Make the camera focus the player
	camera = mp.cameras.new('default', new mp.Vector3(152.6008, -1003.25, -98), new mp.Vector3(-20.0, 0.0, 0.0), 90);
    camera.setActive(true);
	mp.game.cam.renderScriptCams(true, false, 0, true, false);

	// Disable the interface
	mp.game.ui.displayRadar(false);
	mp.game.ui.displayHud(false);
	mp.gui.chat.activate(false);
	mp.gui.chat.show(false);

	// Load the character creation menu
	mp.events.call('createBrowser', ['package://WiredPlayers/statics/html/characterCreator.html']);
});

mp.events.add('updatePlayerSex', (sex) => {
	// Change player's sex
	initializeCharacterCreation(mp.players.local);
	mp.events.callRemote('changeCharacterSex', sex);
});

mp.events.add('updatePlayerCreation', (partName, value, isPercentage) => {
	if(isPercentage) {
		// Calculate the value
		value = parseFloat(value / 100);
	}

	// Update character's head
	faceModel[`${partName}`] = value;
	updatePlayerFace(mp.players.local, faceModel);
});

mp.events.add('cameraPointTo', (bodyPart) => {
	if(bodyPart == 0) {
		// Make the camera point to the body
		camera.setCoord(152.6008, -1003.25, -98);
	} else {
		// Make the camera point to the face
		camera.setCoord(152.3708, -1001.75, -98.45);
	}
});

mp.events.add('rotateCharacter', (rotation) => {
	// Rotate the character
	mp.players.local.setHeading(rotation);
});

mp.events.add('characterNameDuplicated', () => {
	// Duplicated name
	mp.events.call('executeFunction', ['showPlayerDuplicatedWarn']);
});

mp.events.add('acceptCharacterCreation', (name, age) => {
	// Create the new character
	let skinJson = JSON.stringify(faceModel);
	mp.events.callRemote('createCharacter', name, age, skinJson);
});

mp.events.add('cancelCharacterCreation', () => {
	// Get the default camera
	mp.game.cam.renderScriptCams(false, false, 0, true, false);
	camera.destroy();
	camera = undefined;

	// Enable the interface
	mp.game.ui.displayRadar(true);
	mp.game.ui.displayHud(true);
	mp.gui.chat.activate(true);
	mp.gui.chat.show(true);

	// Destroy character creation menu
	mp.events.call('destroyBrowser');

	// Add clothes and tattoos
	mp.events.callRemote('loadCharacter', mp.players.local.name);

	// Show the character list
	mp.events.call('createBrowser', ['package://WiredPlayers/statics/html/sideMenu.html', 'populateCharacterList', characters]);
});

mp.events.add('characterCreatedSuccessfully', () => {
	// Get the default camera
	mp.game.cam.renderScriptCams(false, false, 0, true, false);
	camera.destroy();
	camera = undefined;

	// Enable the interface
	mp.game.ui.displayRadar(true);
	mp.game.ui.displayHud(true);
	mp.gui.chat.activate(true);
	mp.gui.chat.show(true);

	// Destroy character creation menu
	mp.events.call('destroyBrowser');
});

mp.events.add('entityStreamIn', (entity) => {
	// Check if it's a player
	if(entity.getType() === 4) {
		let model = entity.getModel();
        if (mp.game.joaat('mp_m_freemode_01') == model || mp.game.joaat('mp_f_freemode_01') == model) {
			// Get player's custom data
			mp.events.callRemote('getPlayerCustomSkin', entity);

			let walkingStyle = entity.getVariable('PLAYER_WALKING_STYLE');
			if(walkingStyle !== undefined) {
				// Add drunk walking style
				entity.setMovementClipset(walkingStyle, 0.1);
			}
		}
	}
});

mp.events.add('updatePlayerCustomSkin', (player, tattooJsonArray) => {
	// Get custom data
	let face = initializeCharacterCreation(player);
	let tattooArray = JSON.parse(tattooJsonArray);

	// Update character's appearance
	updatePlayerFace(player, face);
	updatePlayerTattoos(player, tattooArray);
});

function initializeCharacterCreation(player) {
	faceModel.firstHeadShape = player === 'undefined' ? 0 : player.getVariable('FIRST_HEAD_SHAPE');
	faceModel.secondHeadShape = player === 'undefined' ? 0 : player.getVariable('SECOND_HEAD_SHAPE');
	faceModel.firstSkinTone = player === 'undefined' ? 0 : player.getVariable('FIRST_SKIN_TONE');
	faceModel.secondSkinTone = player === 'undefined' ? 0 : player.getVariable('SECOND_SKIN_TONE');
	faceModel.headMix = player === 'undefined' ? 0.5 : player.getVariable('HEAD_MIX');
	faceModel.skinMix = player === 'undefined' ? 0.5 : player.getVariable('SKIN_MIX');
	faceModel.hairModel = player === 'undefined' ? 0 : player.getVariable('HAIR_MODEL');
	faceModel.firstHairColor = player === 'undefined' ? 0 : player.getVariable('FIRST_HAIR_COLOR');
	faceModel.secondHairColor = player === 'undefined' ? 0 : player.getVariable('SECOND_HAIR_COLOR');
	faceModel.beardModel = player === 'undefined' ? 0 : player.getVariable('BEARD_MODEL');
	faceModel.beardColor = player === 'undefined' ? 0 : player.getVariable('BEARD_COLOR');
	faceModel.chestModel = player === 'undefined' ? 0 : player.getVariable('CHEST_MODEL');
	faceModel.chestColor = player === 'undefined' ? 0 : player.getVariable('CHEST_COLOR');
	faceModel.blemishesModel = player === 'undefined' ? -1 : player.getVariable('BLEMISHES_MODEL');
	faceModel.ageingModel = player === 'undefined' ? -1 : player.getVariable('AGEING_MODEL');
	faceModel.complexionModel = player === 'undefined' ? -1 : player.getVariable('COMPLEXION_MODEL');
	faceModel.sundamageModel = player === 'undefined' ? -1 : player.getVariable('SUNDAMAGE_MODEL');
	faceModel.frecklesModel = player === 'undefined' ? -1 : player.getVariable('FRECKLES_MODEL');
	faceModel.eyesColor = player === 'undefined' ? 0 : player.getVariable('EYES_COLOR');
	faceModel.eyebrowsModel = player === 'undefined' ? 0 : player.getVariable('EYEBROWS_MODEL');
	faceModel.eyebrowsColor = player === 'undefined' ? 0 : player.getVariable('EYEBROWS_COLOR');
	faceModel.makeupModel = player === 'undefined' ? -1 : player.getVariable('MAKEUP_MODEL');
	faceModel.blushModel = player === 'undefined' ? -1 : player.getVariable('BLUSH_MODEL');
	faceModel.blushColor = player === 'undefined' ? 0 : player.getVariable('BLUSH_COLOR');
	faceModel.lipstickModel = player === 'undefined' ? -1 : player.getVariable('LIPSTICK_MODEL');
	faceModel.lipstickColor = player === 'undefined' ? 0 : player.getVariable('LIPSTICK_COLOR');
	faceModel.noseWidth = player === 'undefined' ? 0.0 : player.getVariable('NOSE_WIDTH');
	faceModel.noseHeight = player === 'undefined' ? 0.0 : player.getVariable('NOSE_HEIGHT');
	faceModel.noseLength = player === 'undefined' ? 0.0 : player.getVariable('NOSE_LENGTH');
	faceModel.noseBridge = player === 'undefined' ? 0.0 : player.getVariable('NOSE_BRIDGE');
	faceModel.noseTip = player === 'undefined' ? 0.0 : player.getVariable('NOSE_TIP');
	faceModel.noseShift = player === 'undefined' ? 0.0 : player.getVariable('NOSE_SHIFT');
	faceModel.browHeight = player === 'undefined' ? 0.0 : player.getVariable('BROW_HEIGHT');
	faceModel.browWidth = player === 'undefined' ? 0.0 : player.getVariable('BROW_WIDTH');
	faceModel.cheekboneHeight = player === 'undefined' ? 0.0 : player.getVariable('CHEEKBONE_HEIGHT');
	faceModel.cheekboneWidth = player === 'undefined' ? 0.0 : player.getVariable('CHEEKBONE_WIDTH');
	faceModel.cheeksWidth = player === 'undefined' ? 0.0 : player.getVariable('CHEEKS_WIDTH');
	faceModel.eyes = player === 'undefined' ? 0.0 : player.getVariable('EYES');
	faceModel.lips = player === 'undefined' ? 0.0 : player.getVariable('LIPS');
	faceModel.jawWidth = player === 'undefined' ? 0.0 : player.getVariable('JAW_WIDTH');
	faceModel.jawHeight = player === 'undefined' ? 0.0 : player.getVariable('JAW_HEIGHT');
	faceModel.chinLength = player === 'undefined' ? 0.0 : player.getVariable('CHIN_LENGTH');
	faceModel.chinPosition = player === 'undefined' ? 0.0 : player.getVariable('CHIN_POSITION');
	faceModel.chinWidth = player === 'undefined' ? 0.0 : player.getVariable('CHIN_WIDTH');
	faceModel.chinShape = player === 'undefined' ? 0.0 : player.getVariable('CHIN_SHAPE');
	faceModel.neckWidth = player === 'undefined' ? 0.0 : player.getVariable('NECK_WIDTH');

	return faceModel;
}

function updatePlayerFace(player, face) {
	player.setHeadBlendData(face.firstHeadShape, face.secondHeadShape, 0, face.firstSkinTone, face.secondSkinTone, 0, face.headMix, face.skinMix, 0, false);
	player.setComponentVariation(2, face.hairModel, 0, 0);
	player.setHairColor(face.firstHairColor, face.secondHairColor);
	player.setEyeColor(face.eyesColor);
	player.setHeadOverlay(1, face.beardModel, 0.99, face.beardColor, 0);
	player.setHeadOverlay(10, face.chestModel, 0.99, face.chestColor, 0);
	player.setHeadOverlay(2, face.eyebrowsModel, 0.99, face.eyebrowsColor, 0);
	player.setHeadOverlay(5, face.blushModel, 0.99, face.blushColor, 0);
	player.setHeadOverlay(8, face.lipstickModel, 0.99, face.lipstickColor, 0);
	player.setHeadOverlay(0, face.blemishesModel, 0.99, 0, 0);
	player.setHeadOverlay(3, face.ageingModel, 0.99, 0, 0);
	player.setHeadOverlay(6, face.complexionModel, 0.99, 0, 0);
	player.setHeadOverlay(7, face.sundamageModel, 0.99, 0, 0);
	player.setHeadOverlay(9, face.frecklesModel, 0.99, 0, 0);
	player.setHeadOverlay(4, face.makeupModel, 0.99, 0, 0);
	player.setFaceFeature(0, face.noseWidth);
	player.setFaceFeature(1, face.noseHeight);
	player.setFaceFeature(2, face.noseLength);
	player.setFaceFeature(3, face.noseBridge);
	player.setFaceFeature(4, face.noseTip);
	player.setFaceFeature(5, face.noseShift);
	player.setFaceFeature(6, face.browHeight);
	player.setFaceFeature(7, face.browWidth);
	player.setFaceFeature(8, face.cheekboneHeight);
	player.setFaceFeature(9, face.cheekboneWidth);
	player.setFaceFeature(10, face.cheeksWidth);
	player.setFaceFeature(11, face.eyes);
	player.setFaceFeature(12, face.lips);
	player.setFaceFeature(13, face.jawWidth);
	player.setFaceFeature(14, face.jawHeight);
	player.setFaceFeature(15, face.chinLength);
	player.setFaceFeature(16, face.chinPosition);
	player.setFaceFeature(17, face.chinWidth);
	player.setFaceFeature(18, face.chinShape);
	player.setFaceFeature(19, face.neckWidth);
}

function updatePlayerTattoos(player, tattooArray) {
	// Load all the tattoos
	for (let i = 0; i < tattooArray.length; i++) {
		let library = mp.game.joaat(tattooArray[i].library);
		let hash = mp.game.joaat(tattooArray[i].hash);
		player.setDecoration(library, hash);
	}
}
