/**
 * Class Terminal
 *
 * How to use it:
 * --------------
 *
 * <div id="terminal" data-action="/xhr-terminal"></div>
 *
 * new Terminal(document.querySelector('#terminal'));
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

		this.m_editor = null;

			this.m_editorTextArea = null;
			this.m_editorInterface = null;
				this.m_editorFilename = null;
				this.m_editorSave = null;
				this.m_editorCancel = null;

		this.m_apiUrl = this.m_parent.dataset.action || location.href;

		this.m_isWaitingForResponse = false;
		this.m_isWaitingForResponseIntervalHandle = null;

		this.Mode = { COMMAND: 'command', EDITOR: 'editor', PASSWORD: 'password'};

		this.m_mode = this.Mode.COMMAND;

		this.m_commandHistory = [];
		this.m_commandHistoryCount = 0;
		this.m_commandHistoryIndex = 0;

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
						this.m_input.addEventListener('keydown', e => { this.inputKeyEvent(e); }, false);
							this.m_promptCommand.appendChild(this.m_input);

			this.m_editor = document.createElement('div');
				this.m_editor.classList.add('terminal__editor');
					docFrag.appendChild(this.m_editor);

				this.m_editorTextArea = document.createElement('textarea');
					this.m_editorTextArea.classList.add('terminal__editor--textarea');
						this.m_editor.appendChild(this.m_editorTextArea);

				this.m_editorInterface = document.createElement('div');
					this.m_editorInterface.classList.add('terminal__editor--interface');
					this.m_editor.appendChild(this.m_editorInterface);

					this.m_editorFilename = document.createElement('p');
						this.m_editorFilename.classList.add('filename');
						this.m_editorFilename.textContent = '';
						this.m_editorInterface.appendChild(this.m_editorFilename);

					this.m_editorSave = document.createElement('a');
						this.m_editorSave.classList.add('save');
						this.m_editorSave.textContent = '[Save]';
							this.m_editorInterface.appendChild(this.m_editorSave);

					this.m_editorCancel = document.createElement('a');
						this.m_editorCancel.classList.add('cancel');
						this.m_editorCancel.textContent = '[Cancel]';
							this.m_editorInterface.appendChild(this.m_editorCancel);

		this.m_parent.appendChild(docFrag);
	}

	/**
	 * @private
	 * @param e
	 */
	inputKeyEvent(e) {

		if (e.key === 'Enter') {
			this.command();
			return;
		}

		if (e.key === 'ArrowUp') {
			this.commandHistoryPrevious();
			return;
		}

		if (e.key === 'ArrowDown') {
			this.commandHistoryNext();
			return;
		}
	}

	/**
	 * @private
	 * @param command
	 */
	commandHistoryAppend(command) {

		if (command === this.m_commandHistory[this.m_commandHistoryCount - 1])
			return;

		this.m_commandHistory.push(command);
		this.m_commandHistoryCount = this.m_commandHistory.length;
		this.m_commandHistoryIndex = this.m_commandHistoryCount; // last (will be --; before display)
	}

	/**
	 * @private
	 */
	commandHistoryPrevious() {

		if (this.m_mode !== this.Mode.COMMAND || this.m_commandHistoryCount === 0)
			return;

		this.m_commandHistoryIndex--;

		if (this.m_commandHistoryIndex < 0) { // At start
			this.m_commandHistoryIndex = 0;
		}

		this.m_input.value = this.m_commandHistory[this.m_commandHistoryIndex];
	}

	/**
	 * @private
	 */
	commandHistoryNext() {

		if (this.m_mode !== this.Mode.COMMAND || this.m_commandHistoryCount === 0)
			return;

		this.m_commandHistoryIndex++;

		if (this.m_commandHistoryIndex >= this.m_commandHistoryCount) {
			this.m_commandHistoryIndex = this.m_commandHistoryCount;
			this.m_input.value = ''; // If overflow, clear input (back to normal)
		} else {
			this.m_input.value = this.m_commandHistory[this.m_commandHistoryIndex];
		}
	}

	/**
	 * @private
	 */
	switchToCommandInterface() {
		this.m_mode = this.Mode.COMMAND;
		this.m_input.type = 'text';
		this.m_input.name = 'terminal[command]';
	}

	switchToEditorInterface() {
		this.m_mode = this.Mode.EDITOR;
	}

	/**
	 * @private
	 */
	switchToPasswordInterface() {
		this.m_mode = this.Mode.PASSWORD;
		this.m_input.type = 'password';
		this.m_input.name = 'terminal[password]';
	}

	/**
	 * @private
	 */
	startWaitingForResponse() {

		let loadingCharsSequence = ['/', '—', '\\', '|'];
		let currentChar = 0;
		let nbChars = loadingCharsSequence.length;

		this.m_promptInfoWaitingForResponse.textContent = loadingCharsSequence[currentChar];

		this.m_isWaitingForResponse = true;
		this.m_isWaitingForResponseIntervalHandle = setInterval(() => {

			currentChar++;

			if (currentChar > nbChars - 1)
				currentChar = 0;

			this.m_promptInfoWaitingForResponse.textContent = loadingCharsSequence[currentChar];

		}, 135);

		this.m_promptInfoWaitingForCommand.style.display = 'none';
		this.m_promptInfoWaitingForResponse.style.display = 'inline';
		this.m_input.disabled = true;
	}

	/**
	 * @private
	 */
	stopWaitingForResponse() {

		this.m_promptInfoWaitingForCommand.style.display = 'inline';
		this.m_promptInfoWaitingForResponse.style.display = 'none';
		this.m_input.disabled = false;
		this.m_input.value = '';

		this.m_isWaitingForResponse = false;
		clearInterval(this.m_isWaitingForResponseIntervalHandle);
	}

	/**
	 * @private
	 * @param {String} output
	 * @param {String|null} lastCommand
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

			let commandResult = document.createElement('pre');
				commandResult.innerHTML = output;
					docFrag.appendChild(commandResult);

		this.m_output.appendChild(docFrag);
	}

	/**
	 * @private
	 */
	clearOutput() {
		this.m_output.textContent = '';
	}

	/**
	 * @private
	 * @param {String} user
	 * @param {String} path
	 */
	setPromptInfo(user, path) {
		this.m_promptInfoUser.textContent = user;
		this.m_promptInfoSeparator.textContent = ':';
		this.m_promptInfoPath.textContent = path;
	}

	/**
	 * @private
	 */
	clearPromptInfo() {
		this.m_promptInfoUser.textContent = '';
		this.m_promptInfoSeparator.textContent = '';
		this.m_promptInfoPath.textContent = '';
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
			this.m_input.focus();
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
				this.setPromptInfo(r.user, r.path);
				this.switchToCommandInterface();
			} else {
				this.switchToPasswordInterface();
			}

			if (typeof r.output !== 'undefined' && r.output !== null)
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

	/**
	 * @private
	 */
	logIn() {
		let data = new FormData();
			data.append('request', 'log-in');
			data.append('password', this.m_input.value);

		let end = () => {
			this.stopWaitingForResponse();
			this.m_input.focus();
		};

		let error = (r = null) => {

			if (r !== null && typeof r.output !== 'undefined' && r.output !== null)
				this.printOutput(r.output);
			else if (typeof r === 'string' || r instanceof String)
				this.printOutput(r);

			end();
		};

		let load = (r) => {

			if (r === null || r.status === 'ERROR') {
				error(r);
				return;
			}

			if (typeof r.response === 'undefined' || r.response === null) {
				error(r);
				return;
			}

			if (r.response === 'ready') {
				this.clearOutput();
				this.setPromptInfo(r.user, r.path);
				this.switchToCommandInterface();
			} else {
				error(r);
				return;
			}

			if (typeof r.output !== 'undefined' && r.output !== null)
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

	/**
	 * @private
	 */
	command() {
		if (this.m_isWaitingForResponse)
			return;

		if (this.m_mode === this.Mode.PASSWORD) {
			this.logIn();
			return;
		}

		let command = this.m_input.value.trim();
			this.commandHistoryAppend(command);

		if (command === 'clear') {
			this.clearOutput();
			// Doesn't need to be started to be stopped
			// We use it to reset the prompt
			this.stopWaitingForResponse();
			return;
		}

		let data = new FormData();
			data.append('request', 'command');
			data.append('command', command);

		let end = () => {
			this.stopWaitingForResponse();
			this.m_input.focus();
		};

		let error = (r = null) => {

			if (r !== null && typeof r.output !== 'undefined' && r.output !== null)
				this.printOutput(r.output);
			else if (typeof r === 'string' || r instanceof String)
				this.printOutput(r);

			end();
		};

		let load = (r) => {

			if (r === null || r.status === 'ERROR') {
				error(r);
				return;
			}

			if (typeof r.response === 'undefined' || r.response === null) {
				error(r);
				return;
			}

			if (typeof r.output !== 'undefined' && r.output !== null)
				this.printOutput(r.output, command);

			if (typeof r.path !== 'undefined' && r.path !== null)
				this.m_promptInfoPath.textContent = r.path;

			if (r.response === 'require-exit') { // User is logged out, reload to reset terminal
				this.clearPromptInfo();
				this.switchToPasswordInterface();
			}

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
