# GroupManagementAppServer

For lack of a better name. (This is work in progress.)

The default name of this project is pretty much self-explanatory: this is a service for managing groups. This service is intended to be a modular group/inventory management service. (I would have named it GroupInventoryManagementAppServer , but that is more of a motuhful than the currrent name.) It is attempt to facilitate real-time updating of inventory records (such as at an event, when resources inventory resources are being handed out during an event, or when an item gets removed from storage).

### Fully customizable group and inventory management

This product brings together group management and inventory management. Though incomplete, this allows users to add, remove, update, and report inventory items. Thus far, the following features have been implemented, as tabs, to some extent: 
*	View/edit Members
*	Member availability
*	Add/edit inventory
* View/modify reported items
*	Inventory history
*	External pages

There will be more to come, but that's the basics for right now.

Admins can create and customize user types and user roles. User roles are assigned privileges. For example, inventory and member creation. By default, there exist two user types (and roles): basic user and admin. Basic user only has view privileges on all the tabs, and admin has edit privileges on all the tabs. A user type can be assigned multiple user roles. For example, one can be a type of user called moderator, who would have the external pages admin role (they can create, delete, view, and modify external links) and a membership approval role (they would have the power to add members to the group site, or remove them if need be). User types and user roles that are admin-defined may be edited in any way, as well as created or deleted. However, the default user types and roles are only name editable.
