/**
 * Copyright 2012 Brett Sutton
 * (Adapted for Google Chrome by Sven Werlen)
 *
 * This file is part of Noojee Click.
 * 
 * Noojee Click is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the 
 * Free Software Foundation, either version 3 of the License, or (at your 
 * option) any later version.
 * 
 * Noojee Click is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License 
 * for more details.
 * 
 * You should have received a copy of the GNU General Public License along 
 * with Noojee Click. If not, see http://www.gnu.org/licenses/.
 **/

noojeeClick.ns(function() { with (noojeeClick.LIB) {

theApp.asterisk =
{

gAsterisk: null,

authRequired: false,

getInstance: function ()
{
	if (this.gAsterisk == null)
	{
		this.gAsterisk = new this.Asterisk();
		this.gAsterisk.init();
	}
		
	return this.gAsterisk;
},

Asterisk: function ()
{
	// channel attached to local phone
	var channel = null;

	// the phone no. which is currently being dialed.
	this.dialing = null; 
	
	// During a call tracks if we have started dialing the remote end.
	this.remoteDialCommenced = false;
	
	// channel attached to remote phone
	this.remoteChannel = null;
	
	this.state = null;
	this.callerid = null;
	this.calleridname = null;
	this.calleridnum = null;
	this.uniqueid = null;
	
	// I've disabled this logic as the problem is that the we don't know what the http timeout
	// value is set to on the asterisk server (defaults to 60 seconds). So we don't
	// actually know when we have to login again. This way we just login every time 
	// we try to dial. For most people this is probably right as they won't dial more than 
	// once a minute so we have probably timed out.
	this.loggedIn = false; 
	
	// Used when a dial is in progress 
	// until the local dial is complete 
	// i.e. the local user answers.
	this.inLocalDial = false; 
	
	this.init = function()
	{
		theApp.util.log("initializing Asterisk");
		var sequence = new theApp.sequence.Sequence( [ new theApp.job.Login(), new theApp.job.Wait(null) ], "", true);
		sequence.run();
	};
	
	this.setLoggedIn = function (loggedIn)
	{
		this.loggedIn = loggedIn;
	};
	
	this.setChannel = function (_channel)
	{
		this.channel = _channel;
		theApp.util.debug("asterisk", "Asterisk.channel set to " + this.channel);
	};

	this.dial = function(phoneNo)
	{
		theApp.util.debug( "asterisk", "Asterisk.dial=" + phoneNo);
		
		// TODO: only set the lastDialed when we successfully dial
		theApp.prefs.setValue("lastDialed", phoneNo);
		
		this.remoteDialCommenced = false;
		this.dialing = phoneNo;
		theApp.util.debug("asterisk", "Asterisk.channel set to null");
		channel = null;
		this.remoteChannel = null;
		this.state = null;	
		
		this.inLocalDial = true;
		
		var dialSequence = null;
		
//		if (this.loggedIn)
			//dialSequence = new theApp.sequence.Sequence( [ new theApp.job.Dial(), new theApp.job.Complete() ], phoneNo, false);
		//else
		
		dialSequence = new theApp.sequence.Sequence( [ new theApp.job.Login(), new theApp.job.Dial(), new theApp.job.Complete() ], phoneNo, false);
		dialSequence.run();
	};

	this.answer = function()
	{
		theApp.util.debug("asterisk", "Asterisk.answer");
		
		this.remoteDialCommenced = false;
		this.state = null;	
		
		var answerSequence;
//		if (this.loggedIn)
	//		answerSequence = new theApp.sequence.Sequence( [ new theApp.job.Answer(), new theApp.job.Complete() ], this.remoteChannel, false);
		//else
			answerSequence = new theApp.sequence.Sequence( [ new theApp.job.Login(), new theApp.job.Answer(), new theApp.job.Complete() ], this.remoteChannel, false);
			
		answerSequence.run();
	};

	this.hangup = function()
	{
		theApp.util.debug("asterisk", "Asterisk.hangup called channel=" + channel);

		// Hangup the our extension
		// we must logon in case our session has timed out since we first logged on.
		
		var sequence = new theApp.sequence.Sequence( [ new theApp.job.Login(), new theApp.job.HangupAction(this.channel), new theApp.job.Complete() ], "", false);
		sequence.run();

		theApp.util.debug("asterisk", "Asterisk.channel set to null");
		this.channel = null;
		this.remoteChannel = null;
		this.state = null;
		this.inLocalDial = false; // Mark the dial is no longer is progress so
									// we can ignore the 'originate failed' message that occurs if we 
									// cancel a dial by hanging up.
	};

	this.logoff = function()
	{
		var sequence = new theApp.sequence.Sequence( [ new theApp.sequence.Logoff(), new theApp.sequence.Complete() ], "", false);
		sequence.run();
	};

	this.processEvent = function(events)
	{
		theApp.util.debug("asterisk", "Asterisk.processEventCalled");
		// 

		theApp.util.debug("asterisk", events.length + " events found");
		for (var i = 0; i < events.length; i++)
		{
			events[i].apply(theApp.asterisk.getInstance());
		}
	};
	
	this.updateState = function(state)
	{
		this.state = state;
		theApp.dialstatus.getInstance().updateStatus(state);
	};
	
	this.parseResponse = function (responseText)
	{
		var result =
		{
		    response :"Error",
		    message :"No Response from Server"
		};
		try
		{
			var xmlDoc;
			if (typeof (DOMParser) != "undefined")
			{
				var message = "none";
				var response = "none";

				theApp.util.debug("asterisk.low", "Parsing:" + responseText);
				var parser = new DOMParser();
				xmlDoc = parser.parseFromString(responseText, "application/xhtml+xml");

				var serverType = theApp.prefs.getValue("serverType"); 
				if (serverType == theApp.noojeeclick.serverTypeList[0].type)
				{
					theApp.util.debug("asterisk", "running AstmanProxy");
					var tag = xmlDoc.getElementsByTagName("Response");
					if (tag[0] != null)
						response = tag[0].getAttribute("Value");
					tag = xmlDoc.getElementsByTagName("Message");
					if (tag[0] != null)
						message = tag[0].getAttribute("Value");

					result =
					{
					    response :response,
					    message :message
					};
				}
				else if (serverType == theApp.noojeeclick.serverTypeList[1].type 
				|| serverType == theApp.noojeeclick.serverTypeList[2].type)
				{
					theApp.util.debug("asterisk", "running AJAM or NJVision");
					var generic = xmlDoc.getElementsByTagName("generic");

					if (generic.length > 0)
					{
						response = generic[0].getAttribute("response");
						message = generic[0].getAttribute("message");
						result =
						{
						    response :response,
						    message :message
						};
					}
				}
				
				if (result.response == "Success")
				{
					// Check for any events
					var events = theApp.event.eventFactory(xmlDoc);
					if (events != null && events.length > 0)
					{
						theApp.asterisk.getInstance().processEvent(events);
					}
				}


			}
		}
		catch (e)
		{
			theApp.util.error(e);
			theApp.util.showException("parseResponse", e);
		}
		return result;
	};

	// Tests if the given channel (from an event usually) matches the 
	// current remote  channel.
	this.isRemoteChannel = function (pChannel)
	{
		var matches = false;
		if (this.remoteChannel != null)
			matches = theApp.util.extractChannel(pChannel).toLowerCase() == theApp.util.extractChannel(this.remoteChannel).toLowerCase();
		return matches;
	};

	this.setRemoteDialCommenced = function(commenced)
	{
		this.remoteDialCommenced = commenced;
		
		// We have completed the local dial portion
		this.inLocalDial = false;
	};
	
	this.isRemoteDialCommenced = function()
	{
		return this.remoteDialCommenced;
	};
	
	this.isLocalDialInProgress = function()
	{
		return this.inLocalDial;
	};
}



};

}});