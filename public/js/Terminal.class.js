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
					this.m_password = null;
					this.m_input = null;

		this.m_editor = null;

			this.m_editorTextArea = null;
			this.m_editorInterface = null;
				this.m_editorFilename = null;
				this.m_editorCancel = null;
				this.m_editorSave = null;
				this.m_editorSaveWaitingForResponse = null;

		this.m_history = null;

			this.m_historyPrevious = null;
			this.m_historyNext = null;

		this.m_apiUrl = this.m_parent.dataset.action || location.href;

		this.m_isWaitingForResponse = false;
		this.m_isWaitingForResponseIntervalHandle = null;

		this.Mode = { COMMAND: 'command', EDITOR: 'editor', PASSWORD: 'password'};

		this.m_mode = this.Mode.COMMAND;

		this.m_editorCurrentFileData = null;

		this.m_commandHistory = [];
		this.m_commandHistoryCount = 0;
		this.m_commandHistoryIndex = 0;

		this.buildTerminalView();

		this.addListeners();

		this.ehlo();
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

					this.m_password = document.createElement('input');
						this.m_password.type = 'password';
						this.m_password.name = 'terminal[password]';
						this.m_password.style.display = 'none';
						this.m_password.addEventListener('keydown', e => { this.inputKeyEvent(e); }, false);
							this.m_promptCommand.appendChild(this.m_password);

					this.m_input = document.createElement('input');
						this.m_input.type = 'text';
						this.m_input.name = 'terminal[command]';
						this.m_input.autocapitalize = 'none';
						this.m_input.autocomplete = false;
						this.m_input.autocorrect = false;
						this.m_input.spellcheck = false;
						this.m_input.style.display = 'none';
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

					this.m_editorCancel = document.createElement('a');
						this.m_editorCancel.classList.add('cancel');
						this.m_editorCancel.textContent = '[Cancel]';
							this.m_editorInterface.appendChild(this.m_editorCancel);

					this.m_editorSave = document.createElement('a');
						this.m_editorSave.classList.add('save');
							this.m_editorInterface.appendChild(this.m_editorSave);

						this.m_editorSave.appendChild(document.createTextNode('[Save'));

						this.m_editorSaveWaitingForResponse = document.createElement('span');
							this.m_editorSaveWaitingForResponse.textContent = '';
								this.m_editorSave.appendChild(this.m_editorSaveWaitingForResponse);

						this.m_editorSave.appendChild(document.createTextNode(']'));

			this.m_history = document.createElement('div');
				this.m_history.classList.add('terminal__history');
				this.m_history.classList.add('hidden'); /* By default on password interface */
					docFrag.appendChild(this.m_history);

			this.m_historyPrevious = document.createElement('a');
				this.m_historyPrevious.classList.add('previous');
				this.m_historyPrevious.textContent = '[⬆]';
					this.m_history.appendChild(this.m_historyPrevious);

			this.m_historyNext = document.createElement('a');
				this.m_historyNext.classList.add('next');
				this.m_historyNext.textContent = '[⬇]';
					this.m_history.appendChild(this.m_historyNext);

		this.m_parent.appendChild(docFrag);
	}

	addListeners() {

		window.addEventListener('load', () => { this.restoreCommandHistory(); }, false);
		window.addEventListener('unload', () => { this.saveCommandHistory(); }, false);

		this.m_editorCancel.addEventListener('click', e => { e.preventDefault(); this.editorCancel(); }, false);
		this.m_editorSave.addEventListener('click', e => { e.preventDefault(); this.editorSave(); }, false);

		this.m_historyPrevious.addEventListener('click', e => { e.preventDefault(); this.commandHistoryPrevious(); }, false);
		this.m_historyNext.addEventListener('click', e => { e.preventDefault(); this.commandHistoryNext(); }, false);
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
	 * Save command history to local storage
	 *
	 * @private
	 */
	saveCommandHistory() {
		localStorage.setItem('_terminal--command-history', JSON.stringify(this.m_commandHistory));
	}

	/**
	 * Restore command history from local storage
	 *
	 * @private
	 */
	restoreCommandHistory() {
		this.m_commandHistory = [];

		try {
			let history = JSON.parse(localStorage.getItem('_terminal--command-history'));

			if (Array.isArray(history))
				this.m_commandHistory = history;
		} catch (e) {}

		this.m_commandHistoryCount = this.m_commandHistory.length;
		this.m_commandHistoryIndex = this.m_commandHistoryCount;
	}

	/**
	 * @private
	 * @param command
	 */
	commandHistoryAppend(command) {

		if (command === '' || command === this.m_commandHistory[this.m_commandHistoryCount - 1]) {
			this.m_commandHistoryIndex = this.m_commandHistoryCount;
			return;
		}

		this.m_commandHistory.push(command);
		this.m_commandHistoryCount = this.m_commandHistory.length;

		const MAX_HISTORY_ELEMENTS = 100;

		// Cap nb elements in history at MAX
		if (this.m_commandHistoryCount > MAX_HISTORY_ELEMENTS) {
			let tooMany = this.m_commandHistoryCount - MAX_HISTORY_ELEMENTS;
			this.m_commandHistoryCount = MAX_HISTORY_ELEMENTS;
			this.m_commandHistory.splice(0, tooMany);
		}

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
		this.m_password.style.display = 'none';
		this.m_input.style.display = null;
		this.m_editor.classList.remove('shown');
		this.m_history.classList.remove('hidden');
		this.m_input.focus();
	}

	switchToEditorInterface() {
		this.m_mode = this.Mode.EDITOR;
		this.m_editor.classList.add('shown');
		this.m_history.classList.add('hidden');
		this.m_editorTextArea.focus();
	}

	/**
	 * @private
	 */
	switchToPasswordInterface() {
		this.m_mode = this.Mode.PASSWORD;
		this.m_password.style.display = null;
		this.m_input.style.display = 'none';
		this.m_editor.classList.remove('shown');
		this.m_history.classList.add('hidden');
		this.m_password.focus();
	}

	/**
	 * @private
	 */
	startWaitingForResponse() {

		let loadingCharsSequence = ['/', '—', '\\', '|'];
		let currentChar = 0;
		let nbChars = loadingCharsSequence.length;

		this.m_promptInfoWaitingForResponse.textContent = loadingCharsSequence[currentChar];
		this.m_editorSaveWaitingForResponse.textContent = loadingCharsSequence[currentChar]; // Editor

		this.m_isWaitingForResponse = true;
		this.m_isWaitingForResponseIntervalHandle = setInterval(() => {

			currentChar++;

			if (currentChar > nbChars - 1)
				currentChar = 0;

			this.m_promptInfoWaitingForResponse.textContent = loadingCharsSequence[currentChar];
			this.m_editorSaveWaitingForResponse.textContent = loadingCharsSequence[currentChar]; // Editor

		}, 135);

		this.m_promptInfoWaitingForCommand.style.display = 'none';
		this.m_promptInfoWaitingForResponse.style.display = 'inline';
		this.m_password.disabled = true;
		this.m_input.disabled = true;
		this.m_editorTextArea.disabled = true; // Editor
		this.m_editorCancel.style.visibility = 'hidden'; // Editor
	}

	/**
	 * @private
	 */
	stopWaitingForResponse() {

		this.m_promptInfoWaitingForCommand.style.display = 'inline';
		this.m_promptInfoWaitingForResponse.style.display = 'none';
		this.m_password.disabled = false;
		this.m_password.value = '';
		this.m_input.disabled = false;
		this.m_input.value = '';
		this.m_editorSaveWaitingForResponse.textContent = ''; // Editor
		this.m_editorTextArea.disabled = false; // Editor
		this.m_editorCancel.style.visibility = null; // Editor

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
			data.append('password', this.m_password.value);

		let end = () => {
			this.stopWaitingForResponse();
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

			} else if (r.response === 'require-editor') {

				this.m_editorCurrentFileData = {
					file: '',
					filename: '',
					new_file: false,
					content: ''
				};

				if (typeof r.file !== 'undefined' && r.file !== null)
					this.m_editorCurrentFileData.file = r.file;

				if (typeof r.filename !== 'undefined' && r.filename !== null)
					this.m_editorCurrentFileData.filename = r.filename;

				if (typeof r.new_file === 'boolean')
					this.m_editorCurrentFileData.new_file = r.new_file;

				if (typeof r.content !== 'undefined' && r.content !== null)
					this.m_editorCurrentFileData.content = r.content;

				this.m_editorTextArea.value = this.m_editorCurrentFileData.content;
				this.m_editorFilename.textContent = '"' + this.m_editorCurrentFileData.filename + '"' +
				                                    (this.m_editorCurrentFileData.new_file ? ' [New File]' : '');

				this.switchToEditorInterface();
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

	/**
	 * @private
	 */
	editorCancel() {
		this.switchToCommandInterface();
		this.m_editorCurrentFileData = null;
	}

	/**
	 * @private
	 */
	editorSave() {

		if (this.m_isWaitingForResponse)
			return;

		if (this.m_mode !== this.Mode.EDITOR)
			return;

		let data = new FormData();
			data.append('request', 'save-file');
			data.append('file', this.m_editorCurrentFileData.file);
			data.append('content', this.m_editorTextArea.value);

		let end = () => {
			this.stopWaitingForResponse();
		};

		let error = (r = null) => {
			alert('[Error] Could not save file.');
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

			this.switchToCommandInterface();
			this.m_editorCurrentFileData = null;
			this.m_editorTextArea.value = '';

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
