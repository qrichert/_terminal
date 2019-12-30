<?php

	namespace App\Controller;

	use Goji\Core\HttpResponse;
	use Goji\Core\Session;
	use Goji\Parsing\RegexPatterns;
	use Goji\Toolkit\SwissKnife;
	use Goji\Toolkit\Terminal;

	class TerminalController {

		/* <ATTRIBUTES> */

		private $m_config;
		private $m_isLoggedIn;
		private $m_isAjaxRequest;

		/* <CONSTANTS> */

		const EHLO = 'ehlo'; // Get current state from server
		const LOG_IN = 'log-in'; // Request log in
		const COMMAND = 'command'; // Regular command

		public function __construct() {

		// Config
			$this->m_config = json_decode(file_get_contents('../config.json'), true);

			// Welcome
			if (!empty($this->m_config['welcome']))
				$this->m_config['welcome'] .= "\n";

			// Password
			$this->m_config['password'] = $this->m_config['password'] ?? null;

				if ($this->m_config['password'] === null)
					$this->m_config['password'] = '';

			// Home
			$this->m_config['home'] = $this->m_config['home'] ?? '';

				if (!is_dir($this->m_config['home']))
					$this->m_config['home'] = dirname(dirname(__DIR__)) . '/public';

				if ($this->m_config['home'] != '/' && mb_substr($this->m_config['home'], -1) == '/')
					$this->m_config['home'] = mb_substr($this->m_config['home'], 0, -1);

			// Alias
			$this->m_config['alias'] = $this->m_config['alias'] ?? null;

				if (!is_array($this->m_config['alias']))
					$this->m_config['alias'] = [];

		// Logged in
			$this->m_isLoggedIn = !empty(Session::get('_terminal'));

		// Ajax
			$this->m_isAjaxRequest = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest';

			if ($this->m_isAjaxRequest)
				HttpResponse::setRobotsHeader(HttpResponse::ROBOTS_NOINDEX);
		}

		/**
		 * @return string
		 */
		private function getLoginString(): string {

			$str = $this->m_config['welcome'] ?? '';

			if ($this->m_config['password'] == 'root')
				$str .= $this->getWarningMessage('Password still has default value.');
			else if (empty($this->m_config['password']))
				$str .= $this->getWarningMessage('No password set.');

			$str .= 'Password: ';

			return $str;
		}

		/**
		 * @param string $message
		 * @return string
		 */
		private function getWarningMessage(string $message): string {
			return '<span class="message__warning">[Warning] ' . $message . '</span>' . "\n";
		}

		/**
		 * @param string $message
		 * @return string
		 */
		private function getErrorMessage(string $message): string {
			return '<span class="message__error">[Error] ' . $message . '</span>' . "\n";
		}

		private function updateDirectory(): void {

			$success = false;

			if (Session::get('_terminal--current-directory') !== null)
				$success = $this->changeDirectory(Session::get('_terminal--current-directory'));
			else
				$success = $this->changeDirectory($this->m_config['home']);

			// If requested dirs don't exist, use current dir instead
			if (!$success)
				$this->changeDirectory(getcwd());
		}

		/**
		 * cd
		 *
		 * @param string $directory
		 * @return bool
		 */
		private function changeDirectory(string $directory): bool {

			if ($directory != '/' && mb_substr($directory, -1) == '/')
				$directory = mb_substr($directory, 0, -1);

			if (@chdir($directory)) {
				$directory = getcwd(); // The real new value, not '..' or '.'
				Session::set('_terminal--current-directory', $directory);
				return true;
			}

			return false;
		}

		/**
		 * Current directory (full path)
		 * @return string
		 */
		private function getCurrentDirectoryPath(): string {

			$currentDir = Session::get('_terminal--current-directory');

			// Set current dir if not yet set
			if ($currentDir === null) {
				$currentDir = getcwd();
				$this->changeDirectory($currentDir);
			}

			return $currentDir;
		}

		/**
		 * Current directory (name only, for display)
		 *
		 * @return string
		 */
		private function getCurrentDirectoryName(): string  {

			$dirName = $this->getCurrentDirectoryPath();

			if ($dirName == $this->m_config['home'])
				return '~';

			$dirName = basename($dirName);

			if (empty($dirName))
				return '/';
			else
				return $dirName;
		}

		/**
		 * Get machine info to display (user, host, etc.)
		 * @param array $info
		 * @throws \Exception
		 */
		private function getSessionInfo(array &$info): void {

			$username = trim(Terminal::execute('whoami'));
				$username = SwissKnife::ceil_str($username, 20, '...');

			$host = trim(Terminal::execute('hostname'));

				// If domain name, keep only DOMAIN & TLD
				// webm042.cluster1337.gra.hosting.ovh.net -> ovh.net
				if (preg_match(RegexPatterns::validateDomainName(), $host)) {

					$host = explode('.', $host);
					$nbParts = count($host);
					$host = $host[$nbParts - 2] . '.' . $host[$nbParts - 1]; // DOMAIN + TLD

				// If space, use part up until first space
				// MacBook Pro de Quentin -> MacBook
				} else if (mb_strpos($host, ' ') !== false) {

					$host = mb_substr($host, 0, mb_strpos($host, ' '));
				}

				$host = SwissKnife::ceil_str($host, 20, '...');

			$info['user'] = $username . '@' . $host;
			$info['path'] = SwissKnife::ceil_str($this->getCurrentDirectoryName(), 20, '...');
			$info['output'] = 'Last login: ' . date('D M j H:i:s');
		}

/* <EHLO> */

		private function processEhlo(): void {

			$response = [];

			if ($this->m_isLoggedIn) {

				$this->updateDirectory();

				$response['response'] = 'ready';
				$this->getSessionInfo($response);

			} else {

				$response['response'] = 'require-authentication';
				$response['output'] = $this->getLoginString();
			}

			HttpResponse::JSON($response, true);
		}

/* <LOG IN> */

		private function processLogIn(): void {

			if (!isset($_POST['password']) || $_POST['password'] !== $this->m_config['password']) {

				HttpResponse::JSON([
					'response' => 'require-authentication',
					'output' => $this->getErrorMessage('Wrong password.')
				], false);
			}

			Session::set('_terminal', true);
			$this->updateDirectory();

			$response = [];

			$response['response'] = 'ready';
			$this->getSessionInfo($response);

			HttpResponse::JSON($response, true);
		}

/* <COMMAND> */

		/**
		 * No command.
		 */
		private function commandEmpty(): void {

			HttpResponse::JSON([
				'response' => 'ok',
				'output' => ''
			], true);
		}

		/**
		 * Exit session.
		 */
		private function commandExit(): void {

			Session::unset('_terminal');
			Session::unset('_terminal--current-directory');

			HttpResponse::JSON([
				'response' => 'require-exit',
				'output' => $this->getLoginString()
			], true);
		}

		/**
		 * Other commands ('default' function)
		 *
		 * @param string $command
		 * @throws \Exception
		 */
		private function command(string $command): void {

			$editors = ['vim', 'vi', 'nano', 'emacs'];
			$disallowedCommands = ['ssh', 'telnet'];
			$disallowedInCombinedCommands = ['clear', 'exit'];
				$disallowedInCombinedCommands = array_merge($disallowedInCombinedCommands, $editors);

			$command = preg_split('#&&|;#', $command);
			$nbCommands = count($command);

			$output = [];

			// Process commands one by one
			foreach ($command as &$c) {

				$c = trim($c);
				$cmdParts = explode(' ', $c);

				// wildcard *
				foreach ($cmdParts as &$cmdPart) {

					$wildCardPosition = mb_strpos($cmdPart, '*');

					// Detect if there's a wild card
					if ($wildCardPosition === false)
						continue;

					$cmdPartCopy = mb_substr($cmdPart, 0, $wildCardPosition);

					// Now we need to know if it's inside quotation marks or not
					// We assume that if the number of quotation marks is even -> no, odd -> yes
					$nbSingleQuotationMarks = mb_substr_count($cmdPartCopy, "'");
					$nbDoubleQuotationMarks = mb_substr_count($cmdPartCopy, '"');

					// So, if one of them is != 0 && odd -> yes, and we break cause we don't interpret it
					if (($nbSingleQuotationMarks !== 0 && $nbSingleQuotationMarks % 2 !== 0)
					    || $nbDoubleQuotationMarks !== 0 && $nbDoubleQuotationMarks % 2 !== 0) {
						continue;
					}

					// Here we have a wildcard we need to transform
					$cmdPart = str_replace(['"', "'"], '', $cmdPart); // Remove quotations

					$fullPath = '';
					// Now we convert the path into a full path

					// Relative path
					if (mb_substr($cmdPart, 0, 1) !== '/')
						$fullPath = SwissKnife::osPathJoin($this->getCurrentDirectoryPath(), $cmdPart);
					// Absolute path
					else
						$fullPath = $cmdPart;

					$files = glob($fullPath);

					if ($files === false || empty($files))
						continue; // Not found, or directory doesn't even exist

					// Here we found a match ! So we take the first & expand the path into a real full path (without . or ..)
					$cmdPart = realpath($files[0]);
				}
				unset($cmdPart);

				// cd
				if ($cmdParts[0] == 'cd') {

					if (empty($cmdParts[1])) {
						$output[] = $this->getErrorMessage('cd: No argument provided.');
						break;
					}

					if ($cmdParts[1] == '~') {
						$this->changeDirectory($this->m_config['home']);
						continue;
					}

					if (!$this->changeDirectory($cmdParts[1]))
						$output[] = $this->getErrorMessage("cd: '{$cmdParts[1]}' doesn't exist.");

					continue;
				}

				// Disallowed commands
				if (in_array($cmdParts[0], $disallowedCommands)) {
					$output[] = $this->getErrorMessage("Command '{$cmdParts[0]}' not allowed.");
					continue;
				}

				// Commands that must be single
				if ($nbCommands > 1 && in_array($cmdParts[0], $disallowedInCombinedCommands)) {
					$output[] = $this->getWarningMessage("Command '{$cmdParts[0]}' must be used alone.");
					continue;
				}

				// Alias
				foreach ($this->m_config['alias'] as $alias) {

					$firstCommandPart = mb_strpos($c, ' ');

						if ($firstCommandPart === false)
							$firstCommandPart = mb_strlen($c);

					// Commands must start the same
					// 'git st' matches, but 'ls git st' doesn't
					if (mb_substr($c, 0, $firstCommandPart) == mb_substr($alias[1], 0, $firstCommandPart))
						$c = str_replace($alias[1], $alias[0], $c);
				}

				// Editor
				if (in_array($cmdParts[0], $editors)) {

					$content = '';
					$newFile = true;

					// File exists, read it
					if (is_file($cmdParts[1])) {
						$content = file_get_contents($cmdParts[1]);
						$newFile = false;
					}

					// If read failed -> error
					if ($content === false) {
						$output[] = $this->getErrorMessage("Cannot read file '{$cmdParts[1]}'. Check permissions.");
						continue;
					}

					HttpResponse::JSON([
						'response' => 'require-editor',
						'file' => $cmdParts[1],
						'filename' => basename($cmdParts[1]),
						'new_file' => $newFile,
						'content' => $content
					], true);
				}

				$output[] = htmlspecialchars(Terminal::execute($c));
			}
			unset($c);

			$output = implode("", $output); // They already end with newline \n

			HttpResponse::JSON([
				'response' => 'ok',
				'output' => $output,
				'path' => $this->getCurrentDirectoryName()
			], true);
		}

		private function processCommand(): void {

			if (!$this->m_isLoggedIn)
				HttpResponse::JSON([], false);

			if (!isset($_POST['command']))
				$_POST['command'] = ''; // Like if it was empty

			$_POST['command'] = trim((string) $_POST['command']);

		// Special commands
			// no command
			if (empty($_POST['command']))
				$this->commandEmpty();
			// exit
			else if ($_POST['command'] == 'exit')
				$this->commandExit();
		// Generic
			else
				$this->command($_POST['command']);
		}

		/**
		 * Treat incoming data.
		 *
		 * Returns a JSON response with status (bool), response (string) and output (string)
		 */
		private function processRequest() {

			if (empty($_POST['request']))
				HttpResponse::JSON([], false);

			if ($this->m_isLoggedIn)
				$this->updateDirectory();

			if ($_POST['request'] == self::EHLO)
				$this->processEhlo();
			else if ($_POST['request'] == self::LOG_IN)
				$this->processLogIn();
			else if ($_POST['request'] == self::COMMAND)
				$this->processCommand();

			HttpResponse::JSON([], false);
		}

		public function render(): void {
			if ($this->m_isAjaxRequest)
				$this->processRequest();
			else
				require_once('../src/App/View/TerminalView.php');
		}
	}
