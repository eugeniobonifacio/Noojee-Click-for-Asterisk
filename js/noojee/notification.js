/**
 * Copyright 2012 Sven Werlen
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

noojeeClick.ns(function()
{
	with (noojeeClick.LIB)
	{

		theApp.notification =
		{

			self : null,

			getInstance : function()
			{
				if (this.self == null)
				{
					this.self = new this.Notification();
				}
				return this.self;
			},

			Notification : function()
			{
				curnotification: null,

				/**
				 * Shows a new notification
				 **/
				this.show = function(icon, title, text, onCloseHandler)
				{
					theApp.util.debug("notification", "Showing " + title);

					this.hide();
					this.curnotification = new Notification(title, {
					  'icon':icon,
					  'body':text
					}); //.Notifications.createNotification(icon,title,text);
					this.curnotification.onclose = onCloseHandler;
					//this.curnotification.show();
				},

				/**
				 * Hides current notification 
				 **/
				this.hide = function()
				{
					if(this.curnotification) {
						this.curnotification.close();
						this.curnotification.onclose = null;
						this.curnotification = null;
					}
				}
			}

		};

	}
});
