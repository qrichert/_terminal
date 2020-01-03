<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>Terminal</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">

		<link rel="shortcut icon" href="<?= WEBROOT; ?>/img/favicon/favicon--medium--256x256.png"> <!-- Favicon -->
		<link rel="apple-touch-icon" sizes="512x512" href="<?= WEBROOT; ?>/img/favicon/favicon--large--512x512.png"> <!-- Safari favorite -->
		<link rel="mask-icon" href="<?= WEBROOT; ?>/img/favicon/bookmark-icon.svg" color="#060607"> <!-- Safari bookmark -->

		<link rel="stylesheet" type="text/css" href="<?= WEBROOT; ?>/css/root.css">
		<link rel="stylesheet" type="text/css" href="<?= WEBROOT; ?>/css/reset.css">
		<link rel="stylesheet" type="text/css" href="<?= WEBROOT; ?>/css/main.css">
		<link rel="stylesheet" type="text/css" href="<?= WEBROOT; ?>/css/terminal.css">
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
