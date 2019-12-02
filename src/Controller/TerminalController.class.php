<?php

	namespace App\Controller;

	use Goji\Core\Session;
	use Goji\Toolkit\Terminal;

	class TerminalController {

		private $m_isLoggedIn;
		private $m_isAjaxRequest;

		public function __construct() {

			$this->m_isLoggedIn = !empty(Session::get('_terminal'));

			$this->m_isAjaxRequest = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest';
		}

		public function render(): void {
			require_once('../src/View/TerminalView.php');
		}
	}
