<?php

require_once '../lib/Settings.php';
require_once '../lib/RootPath.php';
require_once '../lib/AutoLoad.php';

use App\Controller\TerminalController;

$terminalController = new TerminalController();
	$terminalController->render();
