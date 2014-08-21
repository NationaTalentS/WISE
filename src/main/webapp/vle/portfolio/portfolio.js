/**
 * Creates an Portfolio instance
 * @param portfolioJSONObj optional argument, if it is provided it will load
 * the data from the JSON into this object
 * @param createForStep boolean value whether we are creating the portfolio  
 * for a portfolio step
 * @param node the node we are creating the portfolio for (if createForStep is true)
 * @param settings Portfolio settings object, which specifies version, portfolio attribute fields, terminology
 * @return an Portfolio instance
 */
function Portfolio(view, portfolioJSONObj, createForStep, node, settings) {
	this.view = view;
	this.id;
	this.runId;
	this.workgroupId;
	this.items = [];
	this.deletedItems = [];
	this.version = 1;
	this.settings = null;

	// set Portfolio settings and version
	if(settings){
		this.settings = settings;
		if(settings.hasOwnProperty('version')){
			this.version = parseInt(settings.version, 10);
		}
	}

	if(createForStep) {
		//we are adding a portfolio for a portfolio step

		//set the values for the portfolio step
		this.node = node;
		this.view = node.view;
		this.content = node.getContent().getContentJSON();

		if(node.studentWork !== null) {
			this.states = node.studentWork; 
		} else {
			this.states = [];  
		}
	}

	if(settings){
		this.settings = settings;
		this.version = parseInt(settings.version, 10);
	}

	if(view){
		this.view = view;
	}

	if(this.view){
		// set text for customizable terms based on settings or default i18n string
		this.view.insertTranslations();
		this.ideaTerm = this.view.getI18NString('idea');
		this.ideaTermPlural = this.view.getI18NString('idea_plural');
		this.basketTerm = this.view.getI18NString('idea_basket');
		this.ebTerm = this.view.getI18NString('explanation_builder');
		this.addIdeaTerm = this.view.getI18NString('idea_basket_add_an_idea');
		this.privateBasketTerm = this.view.getI18NString('idea_basket_private');
		this.publicBasketTerm = this.view.getI18NString('idea_basket_public');
		if(this.version > 1){
			if(this.settings.hasOwnProperty('ideaTerm') && this.view.utils.isNonWSString(this.settings.ideaTerm)){
				this.ideaTerm = this.settings.ideaTerm;
			}
			if(this.settings.hasOwnProperty('ideaTermPlural') && this.view.utils.isNonWSString(this.settings.ideaTermPlural)){
				this.ideaTermPlural = this.settings.ideaTermPlural;
			}
			if(this.settings.hasOwnProperty('basketTerm') && this.view.utils.isNonWSString(this.settings.basketTerm)){
				this.basketTerm = this.settings.basketTerm;
			}
			if(this.settings.hasOwnProperty('ebTerm') && this.view.utils.isNonWSString(this.settings.ebTerm)){
				this.ebTerm = this.settings.ebTerm;
			}
			if(this.settings.hasOwnProperty('addIdeaTerm') && this.view.utils.isNonWSString(this.settings.addIdeaTerm)){
				this.addIdeaTerm = this.settings.addIdeaTerm;
			}
			if(this.settings.hasOwnProperty('privateBasketTerm') && this.view.utils.isNonWSString(this.settings.privateBasketTerm)){
				this.privateBasketTerm = this.settings.privateBasketTerm;
			}
			if(this.settings.hasOwnProperty('publicBasketTerm') && this.view.utils.isNonWSString(this.settings.publicBasketTerm)){
				this.publicBasketTerm = this.settings.publicBasketTerm;
			}
		}
	}

	/*
	 * portfolioJSONObj will be null in authoring preview step in which case
	 * we do not want to load anything
	 */
	if(portfolioJSONObj) {
		//set the values from the JSON object we received from the server

		this.id = portfolioJSONObj.id;
		this.runId = portfolioJSONObj.runId;
		this.workgroupId = portfolioJSONObj.workgroupId;

		if(portfolioJSONObj.hasOwnProperty('items') && portfolioJSONObj.items !== null) {
			var portfolioItemsJSONArray = portfolioJSONObj.items;
			for (var i=0; i< portfolioItemsJSONArray.length; i++) {
				var portfolioItemJSON = portfolioItemsJSONArray[i];
				this.items.push(new PortfolioItem(portfolioItemJSON));
			}
		}

		if(portfolioJSONObj.hasOwnProperty('deletedItems') && portfolioJSONObj.deletedItems !== null) {
			var portfolioDeletedItemsJSONArray = portfolioJSONObj.deletedItems;
			for (var i=0; i< portfolioDeletedItemsJSONArray.length; i++) {
				var portfolioDeletedItemJSON = portfolioDeletedItemsJSONArray[i];
				this.deletedItems.push(new PortfolioItem(portfolioDeletedItemJSON));
			}
		}
	}
};

function PortfolioItem(object) {
	this.id = object.id;
	this.title = object.title;
	this.itemType = object.itemType;
	this.nodeId = object.nodeId;
	this.studentAnnotation = object.studentAnnotation;
	if (object.timeCreated) {
		this.timeCreated = object.timeCreated;
	} else {
		this.timeCreated = Date.parse(new Date());
	}
};

/**
 * Initialize the Portfolio turning on tablesorter to allow sorting
 * by columns and turning on sortable to allow students to drag and drop
 * rows to manually sort the table
 * @param context
 */
Portfolio.prototype.init = function(context) {
	var enableStep = true,
	message = '',
	workToImport = [];

	//process the tag maps if we are not in authoring mode
	if(this.view && !this.view.authoringMode) {
		//get the tag map results
		var tagMapResults = this.processTagMaps();

		//get the result values
		enableStep = tagMapResults.enableStep;
		message = tagMapResults.message;
		workToImport = tagMapResults.workToImport;
	}
};

/**
 * Returns the highest item id number
 */
Portfolio.prototype.getHighestItemId = function() {
	var highestItemIdSoFar = -1;
	for (var i=0; i<this.items.length; i++) {
		var item = this.items[i];
		if (item.id > highestItemIdSoFar) {
			highestItemIdSoFar = item.id;
		}
	}
	for (var k=0; k<this.deletedItems.length; k++) {
		var deletedItem = this.deletedItems[k];
		if (deletedItem.id > highestItemIdSoFar) {
			highestItemIdSoFar = deletedItem.id;
		}
	}
	return highestItemIdSoFar;
};

Portfolio.prototype.toJSON = function() {
	return {
		"id":this.id,
		"workgroupId":this.workgroupId,
		"runId":this.runId,
		"metadata":this.metadata,
		"items":this.items,
		"deletedItems":this.deletedItems,
		"isPublic":this.isPublic,
		"isSubmitted":this.isSubmitted,
		"tags":this.tags
	};
};

/**
 * Add PortfolioItem to the portfolio
 * @param PortfolioItem object to add
 */
Portfolio.prototype.addItem = function(portfolioItem) {
	this.items.push(portfolioItem);
};

Portfolio.prototype.saveToServerCallback = function(responseText, responseXML, args) {
	var portfolio = args.portfolio;
	alert(portfolio.view.getI18NString("portfolio_save_success"));
};


Portfolio.prototype.saveToServer = function(callback,callbackArgs) {
	if(this.view.config.getConfigParam('mode') !== "portalpreview") {
		//we are not in preview mode so we will post the idea basket back to the server to be saved
		this.runId = this.view.getConfig().getConfigParam('runId');
		this.workgroupId = this.view.getUserAndClassInfo().getWorkgroupId();
		portfolioParams = {
				"action":"savePortfolio",
				"portfolio":JSON.stringify(this),
		};
		this.view.connectionManager.request('POST', 3, 
				this.view.getConfig().getConfigParam('postPortfolioUrl'), 
				portfolioParams, 
				callback, 
				callbackArgs);
	}
};

Portfolio.prototype.addItemSaveToServerCallback = function(responseText, responseXML, args) {
	var portfolio = args.portfolio;
	alert(portfolio.view.getI18NString("portfolio_add_item_success"));
};

/**
 * Hander for add new portfolio item event
 */
Portfolio.prototype.addItemEventHandler = function(event) {
	var view = event.data.view;
	var portfolioItem = new PortfolioItem(event.data);
	// assign new item id
	portfolioItem.id = view.portfolio.getHighestItemId()+1;
	view.portfolio.addItem(portfolioItem);
	view.portfolio.saveToServer(view.portfolio.addItemSaveToServerCallback,{portfolio:view.portfolio});
};


/**
 * Hander for deleting item event
 */
Portfolio.prototype.deleteItemEventHandler = function(event) {
	var portfolioItemIdToDelete = event.data.portfolioItemId;
	var view = event.data.view;
	view.portfolio.deleteItem(portfolioItemIdToDelete);
	view.portfolio.saveToServer(view.portfolio.deleteItemSaveToServerCallback,{portfolio:view.portfolio,'portfolioItemId':portfolioItemIdToDelete});
};

/**
 * Delete a PortfolioItem specified by portfolioItemIdToDelete
 * This simply moves the item from this.items to this.deletedItems
 */
Portfolio.prototype.deleteItem = function(portfolioItemIdToDelete) {
	for (var i=0; i<this.items.length; i++) {
		var item = this.items[i];
		if (item.id == portfolioItemIdToDelete) {
			this.items.splice(i,1);
			this.deletedItems.push(item);
		}
	}
};

/**
 * Callback when the portfolio has been updated on the server after deleting a portfolio item
 */
Portfolio.prototype.deleteItemSaveToServerCallback = function(responseText, responseXML, args) {
	var portfolio = args.portfolio;
	var deletedItemId = args.portfolioItemId;
	alert(portfolio.view.getI18NString("portfolio_delete_item_success"));
	$("#portfolioItem_"+deletedItemId).hide();
};

/**
 * Render the portfolio in the specified dom id
 */
Portfolio.prototype.render = function(domId) {
	console.log('Portfolio.prototype.render, domId:'+domId);

	var workgroupId = this.view.getUserAndClassInfo().getWorkgroupId();

	//check if the portfolioDiv exists
	if($("#"+domId).size()==0){
		//it does not exist so we will create it
		$("#w4_vle").append($('<div id="'+domId+'"></div>'));
	}

	var title = this.view.getI18NString("portfolio");
	if('portfolioSettings' in this.view.getProjectMetadata().tools){
		var portfolioSettings = this.view.getProjectMetadata().tools.portfolioSettings;
		if('portfolioTerm' in portfolioSettings && this.view.utils.isNonWSString(portfolioSettings.portfolioTerm)){
			title = portfolioSettings.portfolioTerm;
		}
	}

	$("#"+domId).dialog({autoOpen:false,closeText:'',resizable:true,modal:true,show:{effect:"fade",duration:200},hide:{effect:"fade",duration:200},title:title,open:this.view.portfolioDivOpen,close:this.view.portfolioDivClose,
		dragStart: function(event, ui) {
			$('#portfolioOverlay').show();
		},
		dragStop: function(event, ui) {
			$('#portfolioOverlay').hide();
		},
		resizeStart: function(event, ui) {
			$('#portfolioOverlay').show();
		},
		resizeStop: function(event, ui) {
			$('#portfolioOverlay').hide();
		}
	});

	//	clear existing portfolio items
	var portfolioItems = $("<div>").attr("id", "portfolioItems");
	$("#"+domId).html(portfolioItems);
	
	//	open the portfolio dialog
	var docHeight = $(document).height()-25;
	var docWidth = $(document).width()-25;
	$("#"+domId).dialog({height:docHeight,width:docWidth});
	$("#"+domId).dialog('open');
	$("#"+domId).scrollTop(0);
	
	//	display portfolio items
	for (var i=0; i<this.items.length;i++) {
		var portfolioItem = this.items[i];
		var nodeId = portfolioItem.nodeId;
		var node = this.view.getProject().getNodeById(nodeId);
		var nodeShowAllWorkHtml = node.getShowAllWorkHtml(this.view);

		var portfolioItemDiv = $("<div>").attr("id","portfolioItem_"+portfolioItem.id).addClass("portfolioItem");
		var portfolioItemHeader = $("<div>").addClass("portfolioItemHeader");
		var portfolioDeleteItemLink = $("<span>").addClass("portfolioDeleteItemLink").html(this.view.getI18NString("portfolio_delete_item"));

		portfolioDeleteItemLink.click({"portfolioItemId":portfolioItem.id, "view":this.view},
				this.deleteItemEventHandler);

		portfolioItemHeader.html(portfolioDeleteItemLink);
		portfolioItemDiv
		.append(portfolioItemHeader)
		.append("<div class='portfolioItemType'>"+portfolioItem.itemType+"</div>")
		.append("<div class='portfolioItemTitle'>"+portfolioItem.title+"</div>")
		.append("<div class='portfolioItemNodeId'>"+portfolioItem.nodeId+"</div>")
		.append("<div class='portfolioItemData'>"+nodeShowAllWorkHtml+"</div>")
		.append("<div class='portfolioItemStudentAnnotation'></div>");

		portfolioItems.append(portfolioItemDiv).append("<br/>");

		if (portfolioItem.studentAnnotation) {
		}

		//only perform this for steps that have a grading view
		if(node.hasGradingView()) {
			//get the node id
			var nodeId = node.id;

			//get the latest node visit that contains student work for this step
			var nodeVisit = this.view.getState().getLatestNodeVisitByNodeId(nodeId);

			//check if the student has any work for this step
			if(nodeVisit != null) {
				//get the div to display the work in
				var studentWorkDiv = $("#latestWork_" + nodeVisit.id);

				//render the work into the div to display it
				node.renderGradingView(studentWorkDiv, nodeVisit, "", workgroupId);

				if($("#new_latestWork_" + nodeVisit.id).length != 0) {
					/*
					 * render the work into the new feedback div if it exists. the
					 * new feedback div exists when the teacher has given a new
					 * score or comment and we need to show the work and feedback
					 * for that step at the the top of the show all work
					 */
					node.renderGradingView($("#new_latestWork_" + nodeVisit.id), nodeVisit, "", workgroupId);
				}
			}
		}
	}
};

/* used to notify scriptloader that this script has finished loading */
if(typeof eventManager !== 'undefined'){
	eventManager.fire('scriptLoaded', 'vle/portfolio/portfolio.js');
}