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

theApp.handlers =
{


// Suppress parent mouse actions.
onMouseOver: function (e)
{
	// We don't want any parent elements to see this otherwise they
	// might do something unexpected.
	e.stopPropagation();

	theApp.util.debug("handlers", "onMouseOver");
	e.preventDefault();
},

//Suppress parent mouse actions.
onMouseOut: function (e)
{
	// We don't want any parent elements to see this otherwise they
	// might do something unexpected.
	e.stopPropagation();
	
	theApp.util.debug("handlers", "onMouseOut");
	e.preventDefault();
},

onDial: function (e)
{
	theApp.util.debug("handlers", "onDial");
	var obj = theApp.noojeeclick.ns6 ? e.target : event.srcElement;
	var phoneNo = obj.getAttribute("phoneNo");

	if (phoneNo == null || phoneNo.length == 0)
		theApp.prompts.showAlert("Please enter a phone number.");
	else {
		chrome.extension.sendRequest({type: "dial", phoneNo: phoneNo});
	}

	return true;
},

/*
* Called when the users clicks the 'Hangup' button on the status bar
* 
*/
onHangup: function ()
{
	theApp.util.debug("handlers", "onHangup");
	theApp.asterisk.getInstance().hangup();
	theApp.noojeeclick.resetIcon();

},


// Just do the simple dial
onDialHandler: function (e)
{
	theApp.util.debug("handlers", "onDialHandler");
	try
	{
		if (!e)
			e = window.event;
		if (!theApp.util.isRClick(e))
		{
			// We don't want any parent elements to see our click otherwise they
			// might do something unexpected.
			e.stopPropagation();

			theApp.handlers.onDial(e);
		}
	}
	catch (e)
	{
		theApp.util.log(e);
		theApp.util.showException("onDialHandler", e);
	}
	e.preventDefault();
},


onDialDifferently: function (e)
{
	theApp.util.debug("handlers", 'Dial differently');

	var obj = ns6 ? e.target : event.srcElement;
	this.doDialDifferently(obj);
},


dialSelectionMenuAction: function ()
{
	theApp.util.debug("handlers", "dialSelectionMenuAction called");
	var phoneNo = theApp.util.getSelectedText();
	if (phoneNo == null || phoneNo.length == 0)
	{
		theApp.prompts.showAlert("Please select a phone number first");
		return;
	}

	var result = theApp.prompts.prompt("Confirm number to dial.", phoneNo);
	if (result.OK == true && result.value != null)
	{
		phoneNo = result.value;
		if (phoneNo.length == 0)
			theApp.prompts.showAlert("Please enter a phone number.");
		else
			theApp.asterisk.getInstance().dial(phoneNo);
	}
},

dialFromClipboardMenuAction: function ()
{
	var phoneNo = theApp.util.trim(theApp.phonepatterns.extractPhoneNo(theApp.util.getClipboardText()));

	var result = theApp.prompts.prompt("Confirm number to dial.", phoneNo);
	if (result.OK == true && result.value != null)
	{
		phoneNo = result.value;
		if (phoneNo.length == 0)
			theApp.prompts.showAlert("Please enter a phone number.");
		else
			theApp.asterisk.getInstance().dial(phoneNo);
	}
},

dialDifferentlyMenuAction: function (target)
{
	target = document.popupNode;
	theApp.util.debug("handlers", "target=" + target);

	// if (target.onImage)
	{
		this.doDialDifferently(target);
	}
	// else
	// showAlert("Dial differently only works on the Noojee Click dial icon");
},

doDialDifferently: function (target)
{
	var phoneNo = target.getAttribute("phoneNo");
	var result = theApp.prompts.prompt("Enter number to dial.", phoneNo);
	if (result.OK == true && result.value != null)
	{
		phoneNo = result.value;
		if (phoneNo.length == 0)
			theApp.prompts.showAlert("Please enter a phone number.");
		else
			theApp.asterisk.getInstance().dial(phoneNo);
	}
},

dialMenuAction: function ()
{
	var phoneNo = "";
	var result = theApp.prompts.prompt("Enter number to dial.", phoneNo);
	if (result.OK == true && result.value != null)
	{
		phoneNo = result.value;
		if (phoneNo.length == 0)
			theApp.prompts.showAlert("Please enter a phone number.");
		else
			theApp.asterisk.getInstance().dial(phoneNo);
	}
},

redialMenuAction: function ()
{
	theApp.util.debug("handlers", "redialMenuAction called");
	var phoneNo = theApp.prefs.getValue("lastDialed");
	if (phoneNo != null && phoneNo.length > 0)
	{
		theApp.asterisk.getInstance().dial(phoneNo);
	}
	else
		theApp.prompts.showAlert("Redial string is empty."); // this shouldn't happen.
},

onAddDialPatternMenuAction: function ()
{
	var fault = false;
	var phoneNo = theApp.util.getRawSelectedText();
	if (phoneNo == null || theApp.util.trim(phoneNo).length == 0)
	{
		theApp.promptsshowAlert("Please select a phone number first");
		return;
	}

	// transpose the phone number into a pattern
	phoneNo = theApp.util.trim(phoneNo);
	var newPattern = "";
	var delimiters = theApp.prefs.getValue("delimiters");
	for ( var i = 0; i < phoneNo.length && fault == false; i++)
	{
		if (delimiters.indexOf(phoneNo[i]) != -1)
			newPattern += phoneNo[i];
		else
		{
			switch (phoneNo[i])
			{
				case '0':
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					newPattern += 'X';
					break;
				case '+':
					newPattern += '+';
					break;
				case ' ':
					newPattern += ' ';
					break;
				default:
					theApp.prompts.showAlert("Unsupported character '" + phoneNo[i] + "' found in phone number. Add the character to the 'Delimiters' field on 'Advanced' tab in the Noojee Click configuration and try again.");
					fault = true;
					break;

			}
		}
	}

	if (!fault)
	{
		var result = theApp.prompts.prompt("Add pattern for " + phoneNo + "?", newPattern);
		if (result.OK == true && result.value != null)
		{
			newPattern  = result.value;

			if (newPattern.length != 0)
			{
				var patternList = theApp.prefs.getValue("pattern");
				patternList += "\n" + newPattern;
				theApp.prefs.setValue("pattern", patternList);
				theApp.render.onRefresh();
			}
		}
	}
},

onShowClickIcons: function ()
{
	var enabled = theApp.prefs.getBoolValue("showClickIcons");
	enabled = !enabled;
	theApp.prefs.setBoolValue("showClickIcons", enabled);
	theApp.render.onRefresh();
	if (enabled == true)
		theApp.asterisk.getInstance().init();
},




};

}});