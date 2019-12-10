<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
		<meta http-equiv="X-UA-Compatible" content="ie=edge">
		<link rel="stylesheet" type="text/css" href="<?= WEBROOT; ?>/css/root.css">
		<link rel="stylesheet" type="text/css" href="<?= WEBROOT; ?>/css/reset.css">
		<link rel="stylesheet" type="text/css" href="<?= WEBROOT; ?>/css/main.css">
		<link rel="stylesheet" type="text/css" href="<?= WEBROOT; ?>/css/lib/Goji/terminal.css">
		<title>Terminal</title>
	</head>
	<body>
		<div id="terminal" data-action="<?= WEBROOT; ?>/xhr"></div>

		<script src="<?= WEBROOT; ?>/js/lib/Goji/SimpleRequest.class.min.js"></script>
		<script src="<?= WEBROOT; ?>/js/Terminal.class.min.js"></script>
		<script>
			(function () {
				new Terminal(document.querySelector('#terminal'));
			})();
		</script>
	</body>
</html>
