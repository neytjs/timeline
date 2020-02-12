const { app, Menu, MenuItem, ipcMain, BrowserWindow, dialog } = require('electron');
const fs = require('fs');

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		height: 1024,
		width: 768,

		webPreferences: {
			nodeIntegration: true,
			devTools: false
		},
		icon: require('path').join(__dirname, 'timeline.png')
	});

	let url = require('url').format({
		protocol: 'file',
		slashes: true,
		pathname: require('path').join(__dirname, 'index.html')
	});

	function resetGlobals() {
		global.search = {
		 	view_all: true,
			search_hidden: true,
			sorted: "",
			ascdesc: "ASC",
			page: 1,
		 	search_arguments: {
				tag: { field: null, searched: null },
				date_start: { field: "", searched: "" },
				date_end: { field: "", searched: "" },
				description: { field: "", searched: "" },
				rank: { field: null, searched: null },
				searchbydate: { field: false, searched: false }
			}
		}
		global.searching_adding = {
			searching_adding: "none"
		}
		global.editing = {
			id: "",
			_id: "",
			unsaved: false,
			tags: "",
			temp: {},
			editing_entry: {},
			loc: ""
		}
		global.adding = {
	    date: new Date(),
	    tags: "",
	    editor: "",
			rank: "0",
	    all_tags: []
		}
		global.analysis = {
			date_start: new Date(),
			date_end: new Date(),
			tag: null,
			analyzed: false
		}
		global.export = {
			file_type: "",
			selection: "",
			jsonChecked: false,
      txtChecked: false,
      allChecked: false,
      selChecked: false,
			message: ""
		}
		global.enterTracker = {
			component_tracker: "",
			tag_insert_tracker: false
		}
	}

	let timeline = " – Timeline";

	const template = [
		{
			label: 'File',
			submenu: [
				{
					label: 'New File',
					click: function() {

						mainWindow.webContents.send('new_db', "");

						mainWindow.setTitle("unsaved" + timeline);

						resetGlobals();
					}
				},
				{
					label: 'Open File...',
					click: function() {
						dialog.showOpenDialog({
							properties: ['openFile'],
							filters: [
  							{ name: 'DBs', extensions: ['db'] }
							]
						}).then((file) => {

							if (file.filePaths.length > 0) {
								mainWindow.webContents.send('load_timeline', file.filePaths[0]);

								mainWindow.setTitle(file[0] + timeline);

								resetGlobals();
							}
						});
					}
				},
				{
					label: 'Save As...',
					click: function() {
						var savePath = dialog.showSaveDialogSync({});
						if (savePath) {

							if (savePath.slice(savePath.length - 3) !== ".db") {
								savePath = savePath + ".db";
							}
							fs.writeFile(savePath, '', function(err) {

								mainWindow.webContents.send('save_as_db', savePath);

								mainWindow.setTitle(savePath + timeline);
							});
						}
					}
				},
        {
            type: 'separator'
        },
				{
					role: 'quit'
				}
			]
		},
		{
			label: 'Timeline',
			submenu: [
				{
					label: 'View Entries',
					click: function() {
						mainWindow.webContents.send('view', 'view');
					}
				},
				{
					label: 'Search Entries (Ctrl+S)',
					click: function() {
						mainWindow.webContents.send('search', 'view');
					}
				},
				{
					label: 'Add Entries (Ctrl+A)',
					click: function() {
						mainWindow.webContents.send('add', 'view');
					}
				},
				{
					label: 'Export Data (Ctrl+E)',
					click: function() {
						mainWindow.webContents.send('export', 'view');
					}
				},
        {
            type: 'separator'
        },
				{
					label: 'Analysis (Ctrl+N)',
					click: function() {
						mainWindow.webContents.send('analysis', 'analysis');
					}
				},
				{
					label: 'Metrics (Ctrl+M)',
					click: function() {
						mainWindow.webContents.send('metrics', 'metrics');
					}
				},
				{
					label: 'Settings',
					click: function() {
						mainWindow.webContents.send('settings', 'settings');
					}
				}
			],
		},
		{
			label: 'Help',
			submenu: [
				{
					label: 'FAQ',
					click: function() {
						mainWindow.webContents.send('help', 'help');
					}
				}
			]
		}
	]


	ipcMain.on('ret_db', function(event, response) {
		mainWindow.setTitle(response + timeline);
	});

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);



	mainWindow.setTitle("unsaved" + timeline);
	mainWindow.loadURL(url);
	mainWindow.maximize();
	mainWindow.webContents.openDevTools();
});

let darwin = process.platform === 'darwin';


app.on('window-all-closed', () => {

  if (!darwin) {
    app.quit();
  }
});


	global.search = {
	 	view_all: true,
		search_hidden: true,
		sorted: "",
		ascdesc: "ASC",
		page: 1,
	 	search_arguments: {
    	tag: { field: null, searched: null },
			date_start: { field: "", searched: "" },
			date_end: { field: "", searched: "" },
			description: { field: "", searched: "" },
			rank: { field: null, searched: null },
			searchbydate: { field: false, searched: false }
		}
	}

	global.searching_adding = {
		searching_adding: "none"
	}

	global.editing = {
		id: "",
		_id: "",
		unsaved: false,
		tags: "",
		temp: {},
		editing_entry: {},
		loc: ""
	}

	global.adding = {
    date: new Date(),
    tags: "",
    editor: "",
		rank: "0",
    all_tags: []
	}

	global.analysis = {
		date_start: new Date(),
		date_end: new Date(),
		tag: null,
		analyzed: false
	}

	global.export = {
		file_type: "",
		selection: "",
		jsonChecked: false,
		txtChecked: false,
		allChecked: false,
		selChecked: false,
		message: ""
	}

	global.enterTracker = {
		component_tracker: "",
		tag_insert_tracker: false
	}
