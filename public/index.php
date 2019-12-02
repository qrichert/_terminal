<?php

	require_once '../lib/Settings.php';
	require_once '../lib/RootPath.php';
	require_once '../lib/AutoLoad.php';

	use App\Controller\TerminalController;

	$terminalController = new TerminalController();
		$terminalController->render();

//	// Ajax = Command
//	if (isset($_SERVER['HTTP_X_REQUESTED_WITH'])
//	    && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {
//
//
//
//	}
//
//	$config = json_decode(file_get_contents('../config.json'), true);
//
//	if (!isset($config['password']))
//		throw new Exception();
//
//
