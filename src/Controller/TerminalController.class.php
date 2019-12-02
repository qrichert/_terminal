<?php

	namespace App\Controller;

	use Exception;
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

		const E_NO_PASSWORD = 0;

		public function __construct() {

		// Config
			$this->m_config = json_decode(file_get_contents('../config.json'), true);

			if (!empty($this->m_config['welcome']))
				$this->m_config['welcome'] .= "\n";

			if (!isset($this->m_config['password']))
				throw new Exception('No password set.', self::E_NO_PASSWORD);

			$this->m_config['password'] = (string) $this->m_config['password'];

		// Logged in
			$this->m_isLoggedIn = !empty(Session::get('_terminal'));

		// Ajax
			$this->m_isAjaxRequest = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest';

			if ($this->m_isAjaxRequest)
				HttpResponse::setRobotsHeader(HttpResponse::ROBOTS_NOINDEX);
		}

		private function getLoginString(): string {

			$str = $this->m_config['welcome'] ?? '';

			if ($this->m_config['password'] == 'root')
				$str .= $this->getWarningMessage('Password still has default value.');

			$str .= 'Password: ';

			return nl2br($str);
		}

		private function getWarningMessage(string $message): string {
			return '<span class="message__warning">[Warning] ' . $message . '</span>' . "\n";
		}

		private function getErrorMessage(string $message): string {
			return '<span class="message__error">[Error] ' . $message . '</span>' . "\n";
		}

		/**
		 * Get machine info to display (user, host, etc.)
		 * @param array $info
		 * @throws \Exception
		 */
		private function getSessionInfo(array &$info) {

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
				} else if (strpos($host, ' ') !== false) {

					$host = mb_substr($host, 0, strpos($host, ' '));
				}

				$host = SwissKnife::ceil_str($host, 20, '...');

			$info['user'] = $username . '@' . $host;
			$info['path'] = SwissKnife::ceil_str(basename(getcwd()), 20, '...');
			$info['output'] = 'Last login: ' . date('D M j H:i:s');
		}

		/**
		 * Treat incoming data.
		 *
		 * Returns a JSON response with status (bool), response (string) and output (string)
		 */
		private function processRequest() {

			if (empty($_POST['request']))
				HttpResponse::JSON([], false);

/* <EHLO> */

			if ($_POST['request'] == self::EHLO) {

				$response = [];

				if ($this->m_isLoggedIn) {

					$response['response'] = 'ready';
					$this->getSessionInfo($response);

				} else {

					$response['response'] = 'require-authentication';
					$response['output'] = $this->getLoginString();
				}

				HttpResponse::JSON($response, true);
			}

/* <LOG IN> */

			else if ($_POST['request'] == self::LOG_IN) {

				if (empty($_POST['password']) || $_POST['password'] !== $this->m_config['password']) {

					HttpResponse::JSON([
						'response' => 'require-authentication',
						'output' => $this->getErrorMessage('Wrong password.'),
						'pws' => $_POST['password']
					], false);
				}

				Session::set('_terminal', true);

				$response = [];

				$response['response'] = 'ready';
				$this->getSessionInfo($response);

				HttpResponse::JSON($response, true);
			}

/* <COMMAND> */

			else if ($_POST['request'] == self::COMMAND) {

				if (!$this->m_isLoggedIn)
					HttpResponse::JSON([], false);

				if (!isset($_POST['command']))
					$_POST['command'] = ''; // Like if it was empty

			// Special commands

				// no command
				if (empty($_POST['command'])) {
					HttpResponse::JSON([
						'response' => 'ok',
						'output' => ''
					], true);
				}

				// exit
				else if ($_POST['command'] == 'exit') {
					Session::unset('_terminal');
					HttpResponse::JSON([
						'response' => 'exit-required',
						'output' => $this->getLoginString()
					], true);
				}

			// Generic

				else {
					$disallowedCommands = ['ssh', 'telnet'];
					$editors = ['vim', 'vi', 'nano', 'emacs'];

					$command = preg_split('#(&&|;)#', $_POST['command']);

					$output = [];

					// Process commands one by one
					foreach ($command as &$c) {
						$cmdParts = explode(' ', $c);
						error_log(print_r($cmdParts, true));

						// Replace editors with cat
						$c = str_replace($editors, 'cat', $c);

						if (in_array($cmdParts[0], $disallowedCommands)) {
							$output[] = "Command '{$cmdParts[0]}' not allowed.\n";
							continue;
						}

						$output[] = Terminal::execute($c);
					}
					unset($c);

					$output = implode("", $output); // They already end with newline \n

					HttpResponse::JSON([
						'response' => 'ok',
						'output' => nl2br($output)
					], true);
				}
			}

			HttpResponse::JSON([], false);
		}

		public function render(): void {
			if ($this->m_isAjaxRequest)
				$this->processRequest();
			else
				require_once('../src/View/TerminalView.php');
		}
	}
