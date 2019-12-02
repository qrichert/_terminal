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
						this.m_input.style.visibility = 'hidden';
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

	/**
	 * @param {String} output
	 * @param {String|null} lastCommand
	 * @private
	 */
	printOutput(output, lastCommand = null) {

		let docFrag = document.createDocumentFragment();

			if (typeof lastCommand === 'string' || lastCommand instanceof String) { // typeof new String('') = object

				let promptInfo = document.createElement('div');
					promptInfo.classList.add('terminal__prompt--info');
						docFrag.appendChild(promptInfo);

					let promptInfoUser = this.m_promptInfoUser.cloneNode(true);
						promptInfo.appendChild(promptInfoUser);

					let promptInfoSeparator = this.m_promptInfoSeparator.cloneNode(true);
						promptInfo.appendChild(promptInfoSeparator);

					let promptInfoPath = this.m_promptInfoPath.cloneNode(true);
						promptInfo.appendChild(promptInfoPath);

					let promptInfoWaitingForCommand = this.m_promptInfoWaitingForCommand.cloneNode(true);
						promptInfoWaitingForCommand.style.display = 'inline';
							promptInfo.appendChild(promptInfoWaitingForCommand);

					promptInfo.appendChild(document.createTextNode(String.fromCharCode(160))); // &nbsp;

					let lastCommandText = document.createElement('span');
						lastCommandText.textContent = lastCommand;
							promptInfo.appendChild(lastCommandText);
			}

			let commandResult = document.createElement('div');
				commandResult.innerHTML = output;
					docFrag.appendChild(commandResult);

		this.m_output.appendChild(docFrag);
	}

	/**
	 * Initial, set-up request
	 *
	 * @private
	 */
	ehlo() {
		let data = new FormData();
			data.append('request', 'ehlo');

		let end = () => {
			this.stopWaitingForResponse();
		};

		let error = () => {
			end();
		};

		let load = (r) => {

			if (r === null || r.status === 'ERROR') {
				error();
				return;
			}

			if (typeof r.response === 'undefined' || r.response === null) {
				error();
				return;
			}

			this.m_input.style.visibility = 'visible';

			if (r.response === 'ready') {

				this.m_promptInfoUser.textContent = r.user;
				this.m_promptInfoSeparator.textContent = ':';
				this.m_promptInfoPath.textContent = r.path;

				this.switchToCommandInterface();
			} else {
				this.switchToPasswordInterface();
			}

			this.printOutput(r.output);

			end();
		};

		this.startWaitingForResponse();

		SimpleRequest.post(
			this.m_apiUrl,
			data,
			load,
			error,
			error,
			null,
			{ get_json: true }
		);
	}
}
