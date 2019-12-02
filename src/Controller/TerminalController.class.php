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

		const EHLO = 'ehlo';

		const E_NO_PASSWORD = 0;

		public function __construct() {

			$this->m_config = json_decode(file_get_contents('../config.json'), true);

			if (!empty($this->m_config['welcome']))
				$this->m_config['welcome'] .= "\n";

			if (!isset($this->m_config['password']))
				throw new Exception('No password set.', self::E_NO_PASSWORD);

			$this->m_isLoggedIn = !empty(Session::get('_terminal'));

			$this->m_isAjaxRequest = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest';

			if ($this->m_isAjaxRequest)
				HttpResponse::setRobotsHeader(HttpResponse::ROBOTS_NOINDEX);
		}

		private function processRequest() {

			if (empty($_POST['request']))
				HttpResponse::JSON([], false);

			if ($_POST['request'] == self::EHLO) {

				$response = [];

				if ($this->m_isLoggedIn) {

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

					$response['response'] = 'ready';
					$response['user'] = $username . '@' . $host;
					$response['path'] = SwissKnife::ceil_str(basename(getcwd()), 20, '...');
					$response['output'] = "Last login: Mon Dec  2 12:27:08 on ttys000";
					$response['output'] = 'Last login: ' . date('D M j H:i:s');

				} else {

					$response['response'] = 'require-authentication';
					$response['output'] = nl2br(($this->m_config['welcome'] ?? '') . 'Password:');
				}

				HttpResponse::JSON($response, true);
			}

			HttpResponse::JSON([], true);
		}

		public function render(): void {
			if ($this->m_isAjaxRequest)
				$this->processRequest();
			else
				require_once('../src/View/TerminalView.php');
		}
	}
