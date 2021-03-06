
/**
 * A representation of a Brainstorm which can be either 
 * open_response or single_choice (not implemented) and
 * can run with a server or serverless
 * @constructor
 * @author: Patrick Lawler
 */
function BRAINSTORM(node){
	this.node = node;
	this.view = node.view;
	this.content = node.getContent().getContentJSON();
	this.states = [];
	this.recentResponses = new Array();
	this.subscribed = false;
	var project = this.view.getProject();
	this.stepTerm = this.view.getStepTerm();

	if(node.studentWork != null) {
		this.states = node.studentWork; 
	} else {
		this.states = [];  
	};
	
	// insert i18n translations
	$('#brain_instructions').html(this.view.getI18NStringWithParams('instructions',[this.view.getI18NString('save','BrainstormNode')],'BrainstormNode'));

	this.contextPath = this.view.getConfig().getConfigParam('contextPath');
	
	//check if this step has already subscribed to the 'classmateWebSocketMessageReceived' event
	if(!this.node.subscribedToClassmateWebSocketMessageReceived) {
		//this step has not already subscribed so we will now
		eventManager.subscribe('classmateWebSocketMessageReceived', this.classmateWebSocketMessageReceived, this);
		
		/*
		 * set a boolean value to denote that this step has subscribed to the
		 * 'classmateWebSocketMessageReceived' event so that it doesn't subscribe
		 * to it again the next time this step is rendered
		 */ 
		this.node.subscribedToClassmateWebSocketMessageReceived = true;
	}
};

/**
 * Prepares the html elements with the appropriate starter
 * options. NOTE: Assumes either brainlite.html or brainfull.html
 * are loaded.
 */
BRAINSTORM.prototype.prepareStarterSentence = function(){
	/* set starter sentence html element values */
	if(this.content.starterSentence.display=='2'){
		this.showStarter();
	};

	if(this.content.starterSentence.display!='1'){
		document.getElementById('starterParent').innerHTML = '';
	} else {
		document.getElementById('starterParent').innerHTML = "<div id='starterSentenceDiv' class='starterSentence'><a onclick='showStarter()'>" + this.view.getI18NString('Show Starter Sentence','BrainstormNode') + "</a></div>";
	};
};

/**
 * Loads the serverless version that this brainstorm represents
 * 
 * @param frameDoc
 * @return
 */
BRAINSTORM.prototype.brainliteLoaded = function(frameDoc){
	var parent = frameDoc.getElementById('main');
	var nextNode = frameDoc.getElementById('studentResponseDiv');
	var old = frameDoc.getElementById('questionPrompt');

	if(old){
		parent.removeChild(old);
	};

	var newQuestion = createElement(frameDoc, 'div', {id: 'questionPrompt'});
	newQuestion.innerHTML = this.content.assessmentItem.interaction.prompt;

	parent.insertBefore(newQuestion, nextNode);

	/* clear any lingering responses */
	frameDoc.getElementById('studentResponse').value = '';

	//get the starterSentence from the xml if any
	this.prepareStarterSentence();

	if (this.states!=null && this.states.length > 0) {
		/*
		 * if the student has posted a response previously, we will display
		 * the canned responses as well as the responses the student has
		 * posted
		 */
		frameDoc.getElementById('studentResponse').value = this.states[this.states.length - 1].response;
		this.showCannedResponses(frameDoc);

		for(var x=0; x<this.states.length; x++) {
			this.addStudentResponse(this.states[x], this.node.view);
		}
	} else if(!this.content.isGated) {
		/*
		 * if the student has not posted before, but this brainstorm
		 * is not gated, we will display the canned responses for
		 * the student to see before they have posted any responses
		 * themselves 
		 */
		this.showCannedResponses(frameDoc);
	};

	/* start the rich text editor if specified */
	/* rte disabled for now. erroneous behavior saving/loading */
	if(this.content.isRichTextEditorAllowed && false){
		var context = this;
		var loc = window.location.toString();
		var vleLoc = loc.substring(0, loc.indexOf('/vle/')) + '/vle/';

		tinymce.init({
		    selector: "#studentResponse",
		    menubar:false,
		    statusbar: false,
		    toolbar: "bold italic"
		});
	}

	this.node.view.eventManager.fire('contentRenderCompleted', this.node.getNodeId(), this.node);
};

/**
 * Handles brainstorm when it has a server backend
 * @param frameDoc the dom object for the brainstorm html interface
 */
BRAINSTORM.prototype.brainfullLoaded = function(frameDoc) {
	var enableStep = true;
	var message = '';
	var workToImport = [];

	//process the tag maps if we are not in authoring mode
	if(this.view.authoringMode == null || !this.view.authoringMode) {
		//get the tag map results
		var tagMapResults = this.processTagMaps();

		//get the result values
		enableStep = tagMapResults.enableStep;
		message = tagMapResults.message;
		workToImport = tagMapResults.workToImport;
	}

	//post the current node visit to the db without an end time
	if (this.state) {
		this.postCurrentNodeVisit(this.processPostSuccessResponse,this.processPostFailureResponse,{});
	}
	this.recentResponses = new Array();
	var parent = frameDoc.getElementById('main');
	var nextNode = frameDoc.getElementById('studentResponseDiv');
	var old = frameDoc.getElementById('questionPrompt');

	if(old){
		parent.removeChild(old);
	};

	/*
	 * create the element that will display the question for the student to
	 * respond to
	 */
	var newQuestion = createElement(frameDoc, 'div', {id: 'questionPrompt'});
	newQuestion.innerHTML = this.content.assessmentItem.interaction.prompt;

	parent.insertBefore(newQuestion, nextNode);

	/* clear any lingering responses */
	frameDoc.getElementById('studentResponse').value = '';

	//get the starterSentence from the xml if any
	this.prepareStarterSentence();

	if (this.states!=null && this.states.length > 0) {
		/*
		 * if the student has previously posted a response to this brainstorm
		 * we will display all the canned and classmate responses. we do not
		 * need to display the responses in the states because all previous
		 * responses should have been posted to the server so they should
		 * show up from calling showClassmateResponses()
		 */
		frameDoc.getElementById('studentResponse').value = this.states[this.states.length - 1].response;
		this.showCannedResponses(frameDoc);
		this.showClassmateResponses(frameDoc);
		this.enableRefreshResponsesButton();
	} else if(workToImport != null && workToImport.length > 0) {
		frameDoc.getElementById('studentResponse').value = workToImport[workToImport.length - 1].response;
		this.showCannedResponses(frameDoc);
		this.showClassmateResponses(frameDoc);
		this.enableRefreshResponsesButton();
	} else if(!this.content.isGated) {
		/*
		 * if this brainstorm is not gated we will display all the canned
		 * and classmate responses
		 */
		this.showCannedResponses(frameDoc);
		this.showClassmateResponses(frameDoc);
		this.enableRefreshResponsesButton();
	};

	var textAreaId = 'studentResponse';
	var thisView = this.view;
	
	/* start the rich text editor if specified */
	/* rte disabled for now. erroneous behavior saving/loading */
	if(this.content.isRichTextEditorAllowed){
		tinymce.init({
			selector: '#' + textAreaId,
		    menubar:false,
		    statusbar: false,
		    toolbar: "bold italic importAsset",
		    contextPath: this.contextPath,
		    relative_urls: false,
		    remove_script_host: false,
		    plugins: 'autoresize',
		    setup: function(ed) {
		       ed.addButton('importAsset', {
		          title: thisView.getI18NString('importAssetButtonTitle','BrainstormNode'),
		          image: this.settings.contextPath + '/vle/lib/tinymce4/js/tinymce/plugins/image/image_alt.png',
		          onclick: function() {
		             var params = {};
		             
		             //set the tinymce object into the params
		             params.tinymce = tinymce;
		             
		             //set the textarea id into the params
		             params.textAreaId = textAreaId;
		             
		             //set the callback function that will be called after a file is uploaded
		             params.callback = thisView.saImport;
		             
		             //display the student asset files so the student can select the one they want
					 eventManager.fire('viewStudentAssets',params);
		          }
		       });
		    }
		});
	} 

	this.node.view.eventManager.fire('contentRenderCompleted', this.node.id, this.node);
};

/**
 * Displays the responses class mates have posted
 * @param frameDoc the dom object for the brainstorm html interface
 */
BRAINSTORM.prototype.showClassmateResponses = function(frameDoc){
	if (this.node.view.config.getConfigParam('mode') == "run") {
		//make the request to get posts made by class mates and then display those posts
		this.node.view.connectionManager.request(
				'GET', 
				2, 
				this.node.view.config.getConfigParam('studentDataURL'),
				{type: 'brainstorm', periodId: this.node.view.userAndClassInfo.getPeriodId(), 
					inOrder: true, 
					userId: this.node.view.userAndClassInfo.getWorkgroupId() + ":" + this.node.view.userAndClassInfo.getClassmateIdsByPeriodId(this.node.view.userAndClassInfo.getPeriodId()), 
					runId:  this.node.view.config.getConfigParam('runId'), 
					nodeId: this.node.getNodeId()
				}, 
				getClassmateResponsesCallback, 
				{frameDoc: frameDoc, 
					recentResponses: this.recentResponses, 
					content: this.content,
					vle: this.node.view,
					bs: this
				}
		);
	};
};

/**
 * A response callback function that calls the showClassmateResponses function
 * @param eventName the name of the event
 * @param fireArgs the args passed to the event when the event is fired
 * @param subscribeArgs the args passed to the event when the event is
 * 		subscribed to 
 */
BRAINSTORM.prototype.showClassmateResponsesCallback = function(eventName, fireArgs, subscribeArgs) {
	subscribeArgs.bs.showClassmateResponses(subscribeArgs.frameDoc);
};

/**
 * This function is used by array.sort(function) which sorts an array
 * using the function that is passed in.
 * This function looks at the timestamp attribute of objects and 
 * sorts them in chronological order, from oldest to newest.
 */
function sortByTimestamp(object1, object2) {
	//get the timestamp values
	var timestamp1 = object1.timestamp;
	var timestamp2 = object2.timestamp;

	/*
	 * return a negative value if 1 comes before 2
	 * return 0 if values are the same
	 * return a positive value if 1 comes after 2
	 */
	return timestamp1 - timestamp2;
}

/**
 * The callback function for displaying class mate posts. After it displays
 * all the class mate posts, we will display the student's recent post from
 * the recentResponses array.
 * @param responseText the response text from the async request
 * @param responseXML the response xml from the async request
 * @param handlerArgs the extra arguments used by this function
 */
function getClassmateResponsesCallback(responseText, responseXML, handlerArgs) {
	var bs = handlerArgs.bs;
	if(responseText) {
		//the responseText should be json

		//parse the json
		visits = $.parseJSON(responseText);

		//used for adding responses to the student UI
		var frameDoc = handlerArgs.frameDoc;
		var responsesParent = frameDoc.getElementById('responses');

		//remove all the responses because we will be displaying them all again
		$('#responses').empty();
		
		//show the canned responses
		bs.showCannedResponses(frameDoc);
		
		/*
		 * the array that holds objects that represent a response. the
		 * object contains a userId, responseText, timestamp 
		 */
		var responseStates = new Array();
		/*
		 * the array that holds objects that represents a reply. the object ontains a
		 * userId, reponseText, timestamp
		 */
		var replyStates = new Array();

		//loop through the visits
		for(var x=0; x<visits.length; x++) {
			//obtain a visit
			var visitObj = visits[x];

			//create a node visit object from the json data
			var nodeVisitObj = NODE_VISIT.prototype.parseDataJSONObj(visitObj.data, handlerArgs.vle);

			//set the id of the node visit object
			nodeVisitObj.id = visitObj.stepWorkId;

			//obtain the userId
			var userId = visitObj.userId;

			//loop through the states in the visit
			for(var y=0; y<nodeVisitObj.nodeStates.length; y++) {
				//obtain a state
				var nodeState = nodeVisitObj.nodeStates[y];
				nodeState.nodeVisitId = nodeVisitObj.id;  // add the nodevisitId in there
				nodeState.userId = userId;

				if (nodeState.postType != null && nodeState.postType == "reply") {
					// this state represents a reply to a post
					replyStates.push(nodeState);
				} else {
					// this state is an original post (first-level)
					responseStates.push(nodeState);
				}
				/*
				 * create an object that will contain the userId, responseText,
				 * and timestamp
				 */ 
				/*
				var responseState = new Object();
				responseState.userId = userId;
				responseState.responseText = nodeState.getStudentWork().response;
				responseState.timestamp = nodeState.timestamp;
				responseState.nodeVisitId = nodeVisitObj.id;


				//add the responseState object to the array
				responseStates.push(responseState);
				 */
			}
		}

		//sort the arrays by timestamp using the function we wrote
		responseStates.sort(sortByTimestamp);
		replyStates.sort(sortByTimestamp);

		//loop through the responseStates
		for(var z=0; z<responseStates.length; z++) {
			//obtain a responseState
			var responseState = responseStates[z];

			//add the response to the UI. this will also show the reply link if reply is enabled for this step.
			bs.addStudentResponse(responseState, handlerArgs.vle, handlerArgs.content);
		}

		// then loop through the reply states and show them
		//loop through the responseStates
		for(var z=0; z<replyStates.length; z++) {
			//obtain a responseState
			var replyState = replyStates[z];

			//add the response to the UI. this will also show the reply link if reply is enabled for this step.
			bs.addStudentResponse(replyState, handlerArgs.vle, handlerArgs.content);
		}


	} else {
		/*
		 * obtain the frameDoc from the handlerArgs. the frameDoc is the
		 * dom object for the brainstorm html interface
		 */
		var frameDoc = handlerArgs.frameDoc;

		/*
		 * retrieve the response(s) the student has posted during this current
		 * node visit
		 */ 
		var recentResponses = handlerArgs.recentResponses;

		//the student's vle
		var vle = handlerArgs.vle;

		//obtain the dom object that holds all the responses
		var responsesParent = frameDoc.getElementById('responses');

		/*
		 * node_visits are wrapped in a workgroup tag, the same workgroup may show
		 * up multiple times in the xml if that workgroup posted multiple times
		 */
		var workgroups = responseXML.getElementsByTagName("workgroup");

		//loop through all the workgroups
		for(var x=0; x<workgroups.length; x++) {
			//obtain the userId (same as workgroupId)
			var userId = workgroups[x].attributes.getNamedItem("userId").nodeValue;

			//the data is the node state xml text
			var data = workgroups[x].getElementsByTagName("data")[0];
			if(data != null && data != "") {
				/*
				 * obtain all the responses from the node state data. each node
				 * state can have multiple response tags if the student posted
				 * multiple times in a single node visit
				 */
				var responses = data.getElementsByTagName("response");

				//loop through the responses in this node visit
				for(var y=0; y<responses.length; y++) {
					//obtain the text the student wrote and posted
					var postText = responses[y].firstChild.nodeValue;

					var dummyState = {response:postText, userId:userId};
					//add the posted response to the user interface
					BRAINSTORM.prototype.addStudentResponse(dummyState, vle);
				};
			};
		};

		BRAINSTORM.prototype.showRecentResponses(frameDoc, recentResponses, responsesParent, vle);
	};

	// get inappropriate flags for this brainstorm and hide them from student view
	BRAINSTORM.prototype.filterInappropriatePosts(handlerArgs.vle);
	
	//set the boolean to denote that we have retrieved the classmate responses
	bs.retrievedClassmateResponses = true;
};

/**
 * Reply to a post or another reply. The student replies to a specific node state which is stored within a node visit.
 *  When the save reply button is clicked, this function is called. It will save
 * the student's reply in the node state and then display everyone's
 * responses including this current one just saved.
 * Note: this is different from savePost which saves a first-level original post. This saves a reply.
 * 
 * @replyText the text of the reply
 * @replyToNodeVisitId the node visit the student is replying to
 * @replyToNodeStateTimestamp the timestamp of the node state within the nodevisit that the student is replying to
 */
BRAINSTORM.prototype.saveReply = function(replyText, replyToNodeVisitId, replyToNodeStateTimestamp) {
	if (this.vle.config.getConfigParam('mode') != "run") {
		return;
	};

	if(replyText && replyText!=""){
		// create a reply brainstorm state
		var postType = "reply";
		var currentState = new BRAINSTORMSTATE(replyText, postType, replyToNodeVisitId, replyToNodeStateTimestamp);
		this.view.pushStudentWork(this.node.id, currentState);
		
		this.states.push(currentState);

		this.recentResponses.push(replyText);
		
		var frameDoc = document;

		//check if we are using a server backend
		if(this.content.useServer) {
			/*
			 * we are using a server backend so we can retrieve other students'
			 * responses
			 */
			currentState.userId=this.node.view.getUserAndClassInfo().getWorkgroupId();


			// create additional data for reply save callback function 
			var additionalCallbackData = {
					"replyState":currentState,
					"replyToNodeVisitId":replyToNodeVisitId,
					"replyToNodeStateTimestamp":replyToNodeStateTimestamp,
					"bs":this,
					"frameDoc":frameDoc
			}

			//get the current node visit
			var currentNodeVisit = this.view.getState().getCurrentNodeVisit();
			
			/*
			 * set the messageType and messageParticipants into the current node visit
			 * which will specify that when the node visit is sent to the server, the
			 * server should also send it to websockets
			 */
			currentNodeVisit.messageType = 'messageFromClassmate';
			currentNodeVisit.messageParticipants = 'studentToClassmatesInPeriod';
			
			/*
			 * post the current node visit to the db immediately without waiting
			 * for the student to exit the step.
			 */	
			this.node.view.postCurrentNodeVisit(this.processPostSuccessResponse,this.processPostFailureResponse,additionalCallbackData);
		} else {
			for(var x=0; x<this.states.length; x++) {
				this.addStudentResponse(this.states[x], this.node.view, this.content);
			}
		}

		//make the "check for new responses" button clickable
		this.enableRefreshResponsesButton();
	} else {
		document.getElementById('saveMsg').innerHTML = "<font color='8B0000'>" + this.view.getI18NString('save_noContent','BrainstormNode') + "</font>";
	};
};

/**
 * Fetch inappropriate flag annotation for this bs step and hide ones that were annotated as inappropriate.
 * @param vle
 */
BRAINSTORM.prototype.filterInappropriatePosts = function(vle){
	this.vle = vle;
	var view = this.view;
	var getInappropriateFlagsCallback = function(responseText, responseXML, handlerArgs) {
		if (responseText != null && responseText != "") {
			var responseJSON = JSON.parse(responseText);
			var flagArray = responseJSON.annotationsArray;
			if (typeof flagArray != "undefined") {
				for (var i=0; i < flagArray.length; i++) {
					var flagJSON = flagArray[i];
					if (flagJSON.type == "inappropriateFlag" && flagJSON.value == "flagged") {
						// replace student's response with generic message
						$("div[bsNodeVisitId="+flagJSON.stepWorkId+"]").each(function() { $(this).find(".responseTextArea").html(handlerArgs.vle.getI18NString('flag_inappropriate','BrainstormNode')) });
					}
				}
			}
		}
	};

	//make the request to get inappropriate flags made by class mates
	vle.connectionManager.request(
			'GET', 
			2, 
			vle.config.getConfigParam('inappropriateFlagsURL'),
			{
				userId:vle.getUserAndClassInfo().getWorkgroupId(),
				periodId:vle.getUserAndClassInfo().getPeriodId()
			},
			getInappropriateFlagsCallback, 
			{
				vle: vle
			}
	);
};

/**
 * This displays the responses made by the author/teacher. This
 * is used in server as well as serverless mode.
 * @param frameDoc the dom object that contains all the brainstorm
 * 		elements
 */
BRAINSTORM.prototype.showCannedResponses = function(frameDoc){
	/* get parent */
	var responsesParent = frameDoc.getElementById('responses');

	if (this.content.cannedResponses) {
		/* create new response elements for each response in canned responses and append to parent */
		for(var p=0;p<this.content.cannedResponses.length;p++){
			var response = createElement(frameDoc, 'div', {rows: '7', cols:  '100', disabled: true, id: this.content.cannedResponses[p].name});
			var responseTitle = createElement(frameDoc, 'div', {id: 'responseTitle_' + this.content.cannedResponses[p].name});
			responseTitle.innerHTML = 'Posted By: &nbsp;' + this.content.cannedResponses[p].name;
			responseTitle.appendChild(createElement(frameDoc, 'br'));
			responseTitle.appendChild(response);
			responseTitle.setAttribute('class', 'responseTitle');
			response.innerHTML = this.content.cannedResponses[p].response;
			response.setAttribute('class', 'responseTextArea');

			responsesParent.appendChild(responseTitle);
			responsesParent.appendChild(createElement(frameDoc, 'br'));
		};
	};

};

/**
 * Displays the responses made by the student during this node visit.
 * These responses have not been posted back to the server yet which
 * is why we need to keep a local copy of them until they have been
 * posted back to the server. This is only used in server mode.
 * @param frameDoc the dom object that contains all the brainstorm
 * 		elements
 * @param recentResponses an array of responses that the student has
 * 		made during this node visit
 * @param responsesParent the dom object of the parent element for 
 * 		the brainstorm
 * @param vle this student's vle
 */
BRAINSTORM.prototype.showRecentResponses = function(frameDoc, recentResponses, responsesParent, vle) {
	/*
	 * loop through all the response(s) the student has posted during the
	 * current node visit and display them
	 */
	for(var z=0; z< recentResponses.length; z++) {
		/*
		 * display the responses the student has just posted during the
		 * current node visit
		 */
		var recentResponse = recentResponses[z];
		var dummyState = {response:recentResponse, userId:vle.getWorkgroupId()};
		BRAINSTORM.prototype.addStudentResponse(dummyState, vle, this.content);
	};
};

/**
 * When the save button is clicked, this function is called. It will save
 * the student's response in the node state and then display everyone's
 * responses including this current one just saved.
 * Note: this is different from saveReply which saves a reply. This saves a first-level original post.
 * @param frameDoc the dom object that contains all the brainstorm elements
 */
BRAINSTORM.prototype.savePost = function(frameDoc){
	if (this.node.view.config.getConfigParam('mode') != "run") {
		alert(this.node.view.getI18NString("save_preview_mode","BrainstormNode"));
		return;
	};

	var response = $('#studentResponse').val();
	
	if(this.content.isRichTextEditorAllowed) {
		response = tinymce.get("studentResponse").getContent();
	} 

	//obtain the dom object that holds all the responses
	var responsesParent = frameDoc.getElementById('responses');

	if(response && response!=""){
		var postType = "new";
		var currentState = new BRAINSTORMSTATE(response, postType);
		this.view.pushStudentWork(this.node.id, currentState);
		this.states.push(currentState);

		frameDoc.getElementById('saveMsg').innerHTML = "<font color='8B0000'>" + this.view.getI18NString('save_success','BrainstormNode') + "</font>";

		this.recentResponses.push(response);

		//check if we are using a server backend
		if(this.content.useServer) {
			/*
			 * we are using a server backend so we can retrieve other students'
			 * responses
			 */
			currentState.userId=this.node.view.getUserAndClassInfo().getWorkgroupId();

			// create additional data for reply save callback function 
			var additionalCallbackData = {
					"isNewPost":true,
					"replyState":currentState,
					"bs":this,
					"frameDoc":frameDoc
			}
			
			//get the current node visit
			var currentNodeVisit = this.view.getState().getCurrentNodeVisit();
			
			/*
			 * set the messageType and messageParticipants into the current node visit
			 * which will specify that when the node visit is sent to the server, the
			 * server should also send it to websockets
			 */
			currentNodeVisit.messageType = 'messageFromClassmate';
			currentNodeVisit.messageParticipants = 'studentToClassmatesInPeriod';
			
			/*
			 * post the current node visit to the db immediately without waiting
			 * for the student to exit the step.
			 */
			this.node.view.postCurrentNodeVisit(this.processPostSuccessResponse,this.processPostSuccessResponse,additionalCallbackData);
		} else {
			for(var x=0; x<this.states.length; x++) {
				this.addStudentResponse(this.states[x], this.node.view, this.content);
			}
		}

		//make the "check for new responses" button clickable
		this.enableRefreshResponsesButton();
	} else {
		frameDoc.getElementById('saveMsg').innerHTML = "<font color='8B0000'>" + this.view.getI18NString('save_noContent','BrainstormNode') + "</font>";
	};
};

/**
 * Add the response to the brainstorm display. This function is used to display
 * canned responses, classmate responses, and recent responses.
 * @param state the node state containing the student's response
 * @param vle the vle of the student who is logged in
 * @param content content for this brainstorm
 */
BRAINSTORM.prototype.addStudentResponse = function(state, vle, content) {
	//obtain the dom object that holds all the responses
	var responsesParent = $('#responses'),
		postedByUserId = state.userId,
		view = this.view;

	var responseMainDiv = $('<div>').addClass('responseMainDiv');
	if (state != null && state.nodeVisitId != null) {
		responseMainDiv.attr('bsNodeVisitId', state.nodeVisitId);
		responseMainDiv.attr('bsNodeStateTimestamp', state.timestamp);
	}

	//create the response title and textarea elements
	var responseTitle = $('<div>').addClass('responseTitle').html("<span class='postedBy'>" + view.getI18NString('postedByLabel','BrainstormNode') + vle.getUserAndClassInfo().getUserNameByUserId(postedByUserId) + "<span>");
	var responseTextArea = $('<div>').attr("rows","7").attr("cols","80").attr("disabled", true)
	.attr('class', 'responseTextArea').html(state.response);

	if (content.isAllowStudentReply) {
		// if student are allowed to reply to other students' posts, add the reply link
		if (state != null && state.nodeVisitId != null) {
			var replyLink = $("<span>").addClass("replyLink")
			.attr("bsNodeVisitId", state.nodeVisitId)
			.attr("bsNodeStateTimestamp", state.timestamp)
			.html("Reply");
			replyLink.click({bs: this, content: content},function(event) {
				var bs = event.data.bs;
				var content = event.data.content;
				// when reply link is clicked, show the reply box directly below where students can enter a reply
				var bsNodeVisitId = $(this).attr("bsnodevisitid");
				var bsNodeStateTimestamp = $(this).attr("bsnodestatetimestamp");
				if ($("#replyDiv_"+bsNodeVisitId+"_"+bsNodeStateTimestamp).length != 0) {
					/*
					 * a reply box already exists, so we will remove it. this acts
					 * as a toggle for the reply box.
					 */
					
					//get the reply div
					var replyDiv = $(".replyDiv[bsnodevisitid='"+bsNodeVisitId+"'][bsnodestatetimestamp='"+bsNodeStateTimestamp+"']");
					
					if(replyDiv != null) {
						/*
						 * remove the tinymce from the reply textarea otherwise the next time we try
						 * to open the reply textarea for the same exact post, the tinymce won't
						 * load
						 */
						tinymce.remove(tinymce.get(replyDiv.find('textarea').attr('id')));
						
						// remove replyDiv with textarea from dom
						replyDiv.remove();
					}
					
					return;
				}

				var replyDiv = $("<div>").addClass("replyDiv").attr("bsNodeVisitId", bsNodeVisitId)
				.attr("bsNodeStateTimestamp", bsNodeStateTimestamp).attr("id","replyDiv_"+bsNodeVisitId+"_"+bsNodeStateTimestamp);
				var replyTextareaId = "replyTextArea_"+bsNodeVisitId+"_"+bsNodeStateTimestamp;
				var replyTextarea = $("<textarea>").addClass("replyTextarea")
				.attr("rows","5").attr("cols","100").attr("bsNodeVisitId", bsNodeVisitId)
				.attr("id",replyTextareaId);
				replyDiv.append(replyTextarea);

				var replySaveButton = $("<input>").addClass("replySaveButton").attr("type","button").val(view.getI18NString('post_reply','BrainstormNode'));

				replySaveButton.click({bs:bs},function(event) {
					var bs = event.data.bs;
					// when Post Reply button is clicked, post reply to server and update UI
					var replyText = $(this).siblings(".replyTextarea").val();
					if (bs.content.isRichTextEditorAllowed) {
						replyText = tinymce.get($(this).siblings(".replyTextarea").attr('id')).getContent();
					}
					var replyToNodeVisitId = $(this).parents(".replyDiv").attr("bsNodeVisitId");
					var replyToNodeStateTimestamp = $(this).parents(".replyDiv").attr("bsNodeStateTimestamp");
					//var bs = handlerArgs.bs;
					bs.saveReply(replyText,replyToNodeVisitId,replyToNodeStateTimestamp);
				});
				// add the "Post Reply" button after the reply text area, at the bottom of the replyDiv
				replyDiv.append(replySaveButton);

				//add the reply div below the post we are replying to
				$($(this).parent().siblings()[0]).after(replyDiv);

				var thisView = bs.view;
				
				// make the reply textareas into a rich text editor
				if(content.isRichTextEditorAllowed){
					tinymce.init({
					    selector: '#' + replyTextareaId,
					    menubar:false,
					    statusbar: false,
					    toolbar: 'bold italic importAsset',
					    contextPath: bs.contextPath,
					    relative_urls: false,
					    remove_script_host: false,
					    plugins: 'autoresize',
					    setup: function(ed) {
					       ed.addButton('importAsset', {
					          title: thisView.getI18NString('importAssetButtonTitle','BrainstormNode'),
					          image: this.settings.contextPath + '/vle/lib/tinymce4/js/tinymce/plugins/image/image_alt.png',
					          onclick: function() {
					             var params = {};
					             
					             //set the tinymce object into the params
					             params.tinymce = tinymce;
					             
					             //set the textarea id into the params
					             params.textAreaId = replyTextareaId;
					             
					             //set the callback function that will be called after a file is uploaded
		        			     params.callback = thisView.saImport;
					             
					             //display the student asset files so the student can select the one they want
								 eventManager.fire('viewStudentAssets', params);
					          }
					       });
					    }
					});
				} 
			});

			// add reply link alongside the title
			responseTitle.append(replyLink);
		} 
	}

	// add the title and textarea to the response main div
	responseMainDiv.append(responseTitle).append(responseTextArea);

	if (state != null && state.postType != null && state.postType == "reply") {
		// this is a reply to a post. show it below the response to which it replies to.
		var replyToNodeVisitId = state.bsReplyToNodeVisitId;
		var replyToNodeStateTimestamp = state.bsReplyToNodeStateTimestamp;

		// get the div that contains the original post that this reply is for
		var replyToDiv = $("div[bsnodevisitid='"+replyToNodeVisitId+"'][bsnodestatetimestamp='"+replyToNodeStateTimestamp+"'].responseMainDiv");

		$(responseMainDiv).addClass("reply");
		
		//add the new post to the end of the div we are replying to
		replyToDiv.append(responseMainDiv);
	} else {
		// this is an original post. show it in the top level 'responses' div.
		$(responseMainDiv).addClass("response");
		responsesParent.append(responseMainDiv);
	}

};

//REMOVE - for testing purposes
BRAINSTORM.prototype.getText = function(){
	var text = '';
	text += 'title: ' + this.title;
	text += '  anonAllowed: ' + this.isAnonymousAllowed;
	text += '  gated: ' + this.isGated;
	text += '  displayNameOption: ' + this.displayNameOption;
	text += '  richText: ' + this.isRichTextEditorAllowed;
	text += '  isPollEnded: ' + this.isPollEnded;
	text += '  isPollActive: ' + this.isInstantPollActive;
	text += '  questionType: ' + this.questionType;
	return text;
};

/**
 * Attempts to retrieve the contentbase url from project and inject
 * it into the content.
 */
BRAINSTORM.prototype.injectBaseRef = function(content){
	if (content.search(/<base/i) > -1) {
		// no injection needed because base is already in the html
		return content;
	} else {
		// NATE!!
		var cbu = contentBaseUrl;
		if (this.node.ContentBaseUrl) {
			cbu = this.node.ContentBaseUrl;
		}
		var domain = 'http://' + window.location.toString().split("//")[1].split("/")[0];

		if(window.parent.vle){
			var baseRefTag = "<base href='" + window.parent.vle.project.cbu + "'/>";
		} else if(typeof vle!='undefined'){
			var baseRefTag = "<base href='" + vle.project.cbu + "'/>";
		} else {
			return content;
		};

		var headPosition = content.indexOf("<head>");
		var newContent = content.substring(0, headPosition + 6);  // all the way up until ...<head>
		newContent += baseRefTag;
		newContent += content.substring(headPosition+6);

		return newContent;
	};	
};

/**
 * Places the starter sentence, if provided, at the top of the
 * response and appends any of the student's work after it.
 */
BRAINSTORM.prototype.showStarter = function(){
	if(this.content.starterSentence.display != '0'){

		//get the response box element
		var responseBox = document.getElementById('studentResponse');

		//update normally if rich text editor is not available
		if(!this.richTextEditor){
			responseBox.value = this.content.starterSentence.sentence + '\n\n' + responseBox.value;
		} else {//otherwise, we need to set it in the editor instance
			this.richTextEditor.setContent(this.content.starterSentence.sentence + '<br/><br/>' + this.richTextEditor.getContent());
		};

		//link clicked, so remove it
		document.getElementById('starterParent').innerHTML = '';
	} else {
		this.node.view.notificationManager.notify(this.view.getI18NStringWithParams('noStarter',[this.stepTerm],'BrainstormNode'), 3);
	};
};

/**
 * Retrieve responses again so that the student can see
 * all the latest responses
 * @param frameDoc
 */
BRAINSTORM.prototype.refreshResponses = function(frameDoc) {
	if (this.node.view.config.getConfigParam('mode') === "preview") {
	   alert(this.node.view.getI18NString("check_for_new_responses_preview_mode","BrainstormNode"));
	   return;
	}

	/*
	 * clear the responses because the show functions after this
	 * just append to the div
	 */
	this.clearResponses();

	//show the canned responses
	this.showCannedResponses(frameDoc);
	
	//check if we are using a server
	if(this.content.useServer) {
		//show the classmate responses by requesting them from the server
		this.showClassmateResponses(frameDoc);
	}
};

/**
 * Clears the responses div
 */
BRAINSTORM.prototype.clearResponses = function() {
	document.getElementById("responses").innerHTML = "";
};

/**
 * Makes the "Check for new responses" button clickable
 */
BRAINSTORM.prototype.enableRefreshResponsesButton = function() {
	document.getElementById("refreshResponsesButton").disabled = false;
};

/**
 * Makes the "Check for new responses" button not clickable
 */
BRAINSTORM.prototype.disableRefreshResponsesButton = function() {
	document.getElementById("refreshResponsesButton").disabled = true;
};

/**
 * Process the tag maps and obtain the results
 * @return an object containing the results from processing the
 * tag maps. the object contains three fields
 * enableStep
 * message
 * workToImport
 */
BRAINSTORM.prototype.processTagMaps = function() {
	var enableStep = true;
	var message = '';
	var workToImport = [];

	//the tag maps
	var tagMaps = this.node.tagMaps;

	//check if there are any tag maps
	if(tagMaps != null) {

		//loop through all the tag maps
		for(var x=0; x<tagMaps.length; x++) {

			//get a tag map
			var tagMapObject = tagMaps[x];

			if(tagMapObject != null) {
				//get the variables for the tag map
				var tagName = tagMapObject.tagName;
				var functionName = tagMapObject.functionName;
				var functionArgs = tagMapObject.functionArgs;

				if(functionName == "importWork") {
					//get the work to import
					workToImport = this.node.getWorkToImport(tagName, functionArgs);
				} else if(functionName == "showPreviousWork") {
					//show the previous work in the previousWorkDiv
					this.node.showPreviousWork($('#previousWorkDiv'), tagName, functionArgs);
				} else if(functionName == "checkCompleted") {
					//we will check that all the steps that are tagged have been completed

					//get the result of the check
					var result = this.node.checkCompleted(tagName, functionArgs);
					enableStep = enableStep && result.pass;

					if(message == '') {
						message += result.message;
					} else {
						//message is not an empty string so we will add a new line for formatting
						message += '<br>' + result.message;
					}
				}
			}
		}
	}

	if(message != '') {
		//message is not an empty string so we will add a new line for formatting
		message += '<br>';
	}

	//put the variables in an object so we can return multiple variables
	var returnObject = {
			enableStep:enableStep,
			message:message,
			workToImport:workToImport
	};

	return returnObject;
};

/**
 * Handles the response from posting student data to the server. 
 * Gets called after default processPostResponse.
 * 
 * @param responseText a json string containing the response data
 * @param responseXML
 * @param args any args required by this callback function which
 * 		were passed in when the request was created
 */
BRAINSTORM.prototype.processPostSuccessResponse = function(responseText, responseXML, args){
	if (args.additionalData.replyState) {  // this is a callback for a reply that was saved successfully. remove the reply textarea and show it in the UI.
		var replyState = args.additionalData.replyState;
		replyState.nodeVisitId = JSON.parse(responseText).id; // get the new nodevisit id and set it in this state so replies can happen on this reply.
		var replyToNodeVisitId = args.additionalData.replyToNodeVisitId;
		var replyToNodeStateTimestamp = args.additionalData.replyToNodeStateTimestamp;
		var bs = args.additionalData.bs;
		var content = bs.content;
		var frameDoc = args.additionalData.frameDoc;

		/*
		 * if the student replied to another post, get the div that contains the textarea 
		 * that was used to type the reply
		 */
		var replyDiv = $(".replyDiv[bsnodevisitid='"+replyToNodeVisitId+"'][bsnodestatetimestamp='"+replyToNodeStateTimestamp+"']");
		
		if(replyDiv != null && replyDiv.length != 0) {
			/*
			 * remove the tinymce from the reply textarea otherwise the next time we try
			 * to open the reply textarea for the same exact post, the tinymce won't
			 * load
			 */
			tinymce.remove(tinymce.get(replyDiv.find('textarea').attr('id')));
			
			// remove replyDiv with textarea from dom
			replyDiv.remove();
		}
		

		//get the div for the new post
		var newNodeVisitId = replyState.nodeVisitId;
		var newTimestamp = replyState.timestamp;
		var newDiv = $("div[bsnodevisitid='"+newNodeVisitId+"'][bsnodestatetimestamp='"+newTimestamp+"']");
		
		if(newDiv != null && newDiv.length > 0) {
			//scroll the screen to display the new post at the top of the screen
			newDiv[0].scrollIntoView(true);
		}
		
		if(!bs.retrievedClassmateResponses || this.vle.socket == null || this.vle.socket.readyState != 1) {
			/*
			 * we have not retrieved the classmate responses yet so we will now.
			 * if websockets is not enabled or not open, we will also retrieve the classmate 
			 * responses since we won't be receiving them from websockets. this means if
			 * websockets are not enabled, we will retrieve the classmate responses
			 * every time this student submits a post.
			 */
			bs.showClassmateResponses(frameDoc);
		}
	} else if (args.additionalData.isNewPost) {
		// this is a callback for a new post that was saved successfully. Diplay the new post in the UI
		var bs = args.additionalData.bs;
		var content = bs.content;
		bs.addStudentResponse(replyState, this.vle, content);
		
	}
};

/**
 * Handles the FAIL response from posting student data to the server.
 * @param responseText a json string containing the response data
 * @param responseXML
 * @param args any args required by this callback function which
 * 		were passed in when the request was created
 */
BRAINSTORM.prototype.processPostFailResponse = function(responseText, args){
	// this is a callback for a failed save.
	var bs = args.additionalData.bs;
	bs.node.view.notificationManager.notify(this.view.getI18NString('save_fail'), 5);	
};

/**
 * Called when the 'classmateWebSocketMessageReceived' event is fired
 * @param type the event name 'classmateWebSocketMessageReceived'
 * @param args the arguments passed in when the event is fired
 * @param obj this brainstorm object
 */
BRAINSTORM.prototype.classmateWebSocketMessageReceived = function(type, args, obj) {
	//get this brainstorm object
	var thisBrainstorm = obj;
	
	//get the websocket data that the classmate has sent us which is a node visit
	var data = args[0];
	
	if(data != null) {
		//get the node id of the classmate work
		var nodeId = data.nodeId;

		if(thisBrainstorm != null) {
			
			//make sure the classmate work is for this step
			if(thisBrainstorm.node.id == nodeId) {
				
				//get the current step this student is on
				var currentNode = thisBrainstorm.view.getCurrentNode();
				
				//make sure the classmate work is for the current step we are on
				if(currentNode.id == nodeId) {
					
					//process the classmate websocket message
					thisBrainstorm.classmateWebSocketMessageReceivedHandler(data);
				}
			}			
		}
	}
};

/**
 * Handle the classmate websocket message
 * @param data the websocket message from the classmate
 */
BRAINSTORM.prototype.classmateWebSocketMessageReceivedHandler = function(data) {
	//the classmate websocket message is a nodevisit for this step
	var nodeVisit = data;
	
	//get the step content
	var content = this.content;
	
	//get the view
	var view = this.view;
	
	if(nodeVisit != null) {
		//get the node states in the node visit
		var nodeStates = nodeVisit.nodeStates;
		
		//get the node visit id
		var nodeVisitId = nodeVisit.id;
		
		if(nodeStates != null && nodeStates.length > 0) {
			//get the latest node state
			var nodeState = nodeStates[nodeStates.length - 1];
			
			//inject the node visit id into the node state
			nodeState.nodeVisitId = nodeVisitId;
			
			if((this.states != null && this.states.length > 0) || !this.content.isGated) {
				/*
				 * the student has already submitted a post or the step is not gated
				 * so we can show the student their classmate's new post received from
				 * websockets
				 */
				
				//display the classmate response
				this.addStudentResponse(nodeState, view, content);
			}
		}
	}
};

//used to notify scriptloader that this script has finished loading
if(typeof eventManager != 'undefined'){
	eventManager.fire('scriptLoaded', 'vle/node/brainstorm/brainstorm.js');
};