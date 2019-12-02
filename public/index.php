<?php

	session_start();

	// Ajax = Command
	if (isset($_SERVER['HTTP_X_REQUESTED_WITH'])
	    && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {



	}

	$config = json_decode(file_get_contents('../config.json'), true);

	if (!isset($config['password']))
		throw new Exception();

	readfile('../src/TerminalView.html');
