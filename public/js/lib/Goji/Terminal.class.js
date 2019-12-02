/**
 * Class Terminal
 */
class Terminal {

	constructor(parent) {

		this.m_parent = parent;

			this.m_output = null;
			this.m_prompt = null;
				this.m_promptInfo = null;
					this.m_promptInfoUser = null;
					this.m_promptInfoSeparator = null;
					this.m_promptInfoPath = null;
					this.m_promptInfoWaitingForCommand = null;
					this.m_promptInfoWaitingForResponse = null;
				this.m_promptCommand = null;
					this.m_input = null;

		this.m_apiUrl = location.href;

		this.m_isWaitingForResponseIntervalHandle = null;

		this.buildTerminalView();

		// If loaded while active session
		if (typeof this.m_parent.dataset.loggedIn !== 'undefined'
			 && this.m_parent.dataset.loggedIn === 'true') { // Starts logged in
			this.switchToCommandInterface();
		} else {
			this.switchToPasswordInterface();
		}

		this.ehlo();

		this.m_input.focus();
	}

	/**
	 * @private
	 */
	buildTerminalView() {

		this.m_parent.classList.add('terminal');

		let docFrag = document.createDocumentFragment();

			this.m_output = document.createElement('div');
				this.m_output.classList.add('terminal__output');
					docFrag.appendChild(this.m_output);

			this.m_prompt = document.createElement('div');
				this.m_prompt.classList.add('terminal__prompt');
					docFrag.appendChild(this.m_prompt);

				this.m_promptInfo = document.createElement('div');
					this.m_promptInfo.classList.add('terminal__prompt--info');
						this.m_prompt.appendChild(this.m_promptInfo);

					this.m_promptInfoUser = document.createElement('span');
						this.m_promptInfoUser.classList.add('user');
							this.m_promptInfo.appendChild(this.m_promptInfoUser);

					this.m_promptInfoSeparator = document.createElement('span');
						this.m_promptInfoSeparator.classList.add('separator');
							this.m_promptInfo.appendChild(this.m_promptInfoSeparator);

					this.m_promptInfoPath = document.createElement('span');
						this.m_promptInfoPath.classList.add('path');
							this.m_promptInfo.appendChild(this.m_promptInfoPath);

					this.m_promptInfoWaitingForCommand = document.createElement('span');
						this.m_promptInfoWaitingForCommand.classList.add('waiting-for-command');
						this.m_promptInfoWaitingForCommand.textContent = '$';
							this.m_promptInfo.appendChild(this.m_promptInfoWaitingForCommand);

					this.m_promptInfoWaitingForResponse = document.createElement('span');
						this.m_promptInfoWaitingForResponse.classList.add('waiting-for-response');
						this.m_promptInfoWaitingForResponse.textContent = '';
							this.m_promptInfo.appendChild(this.m_promptInfoWaitingForResponse);

					this.m_promptInfo.appendChild(document.createTextNode(String.fromCharCode(160))); // &nbsp;

				this.m_promptCommand = document.createElement('div');
					this.m_promptCommand.classList.add('terminal__prompt--command');
						this.m_prompt.appendChild(this.m_promptCommand);

					this.m_input = document.createElement('input');
						this.m_input.autocapitalize = 'off';
						this.m_input.spellcheck = 'false';
							this.m_promptCommand.appendChild(this.m_input);

		this.m_parent.appendChild(docFrag);
	}

	switchToCommandInterface() {
		this.m_input.type = 'text';
	}

	switchToPasswordInterface() {
		this.m_input.type = 'password';
	}

	/**
	 * @private
	 */
	startWaitingForResponse() {

		let loadingCharsSequence = ['/', '—', '\\', '|'];
		let currentChar = 0;
		let nbChars = loadingCharsSequence.length;

		this.m_promptInfoWaitingForResponse.textContent = loadingCharsSequence[currentChar];

		this.m_isWaitingForResponseIntervalHandle = setInterval(() => {

			currentChar++;

			if (currentChar > nbChars - 1)
				currentChar = 0;

			this.m_promptInfoWaitingForResponse.textContent = loadingCharsSequence[currentChar];

		}, 150);

		this.m_promptInfoWaitingForCommand.style.display = 'none';
		this.m_promptInfoWaitingForResponse.style.display = 'inline';
	}

	/**
	 * @private
	 */
	stopWaitingForResponse() {

		this.m_promptInfoWaitingForCommand.style.display = 'inline';
		this.m_promptInfoWaitingForResponse.style.display = 'none';

		clearInterval(this.m_isWaitingForResponseIntervalHandle);
	}

	commandError() {

		alert('error');
	}

	commandLoad(response = null) {

		if (response === null || response.status === 'ERROR') {
			this.commandError();
			return;
		}

		alert('success');
	}

	/**
	 * Initial, set-up request
	 *
	 * @private
	 */
	ehlo() {
		let data = new FormData();
			data.append('type', 'ehlo');

		SimpleRequest.post(
			this.m_apiUrl,
			data,
			(r) => { this.commandLoad(r); },
			() => { this.commandError(); },
			() => { this.commandError(); },
			null,
			{ get_json: true }
		);
	}
}
