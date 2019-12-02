<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
		<meta http-equiv="X-UA-Compatible" content="ie=edge">
		<link rel="stylesheet" type="text/css" href="css/root.css">
		<link rel="stylesheet" type="text/css" href="css/reset.css">
		<link rel="stylesheet" type="text/css" href="css/main.css">
		<link rel="stylesheet" type="text/css" href="css/lib/Goji/terminal.css">
		<title>Terminal</title>
	</head>
	<body>
		<div id="terminal" <?= $this->m_isLoggedIn ? 'data-logged-in="true"' : ''; ?>>
			<!--<div class="terminal__output">
				Last login: Mon Dec  2 12:27:08 on ttys000
			</div>
			<div class="terminal__prompt">
				<div class="terminal__prompt--info">
					<span class="terminal__prompt--info user">user@terminal</span>:<span class="terminal__prompt--info path">~</span>$&nbsp;
				</div>
				<div class="terminal__prompt--command">
					<input type="text" autocapitalize="off" class="terminal__input--text">
				</div>
			</div>-->
		</div>

		<script src="js/lib/goji/SimpleRequest.class.min.js"></script>
		<script src="js/lib/goji/Terminal.class.js"></script>
		<script>
			(function () {
				new Terminal(document.querySelector('#terminal'))
			})();
		</script>
	</body>
</html>
