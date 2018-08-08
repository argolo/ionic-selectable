import { Component, ContentChild, DoCheck, ElementRef, EventEmitter, forwardRef, HostBinding, HostListener, Input, IterableDiffer, IterableDiffers, OnDestroy, OnInit, Optional, Output, TemplateRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Form, InfiniteScroll, Item, Modal, ModalController, Platform } from 'ionic-angular';
import { Subscription } from 'rxjs';
import { SelectSearchableAddItemTemplateDirective } from './select-searchable-add-item-template.directive';
import { SelectSearchableCloseButtonTemplateDirective } from './select-searchable-close-button-template.directive.';
import { SelectSearchableGroupRightTemplateDirective } from './select-searchable-group-right-template.directive';
import { SelectSearchableGroupTemplateDirective } from './select-searchable-group-template.directive';
import { SelectSearchableItemRightTemplateDirective } from './select-searchable-item-right-template.directive';
import { SelectSearchableItemTemplateDirective } from './select-searchable-item-template.directive';
import { SelectSearchableMessageTemplateDirective } from './select-searchable-message-template.directive';
import { SelectSearchablePageComponent } from './select-searchable-page.component';
import { SelectSearchablePlaceholderTemplateDirective } from './select-searchable-placeholder-template.directive';
import { SelectSearchableSearchFailTemplateDirective } from './select-searchable-search-fail-template.directive';
import { SelectSearchableTitleTemplateDirective } from './select-searchable-title-template.directive';
import { SelectSearchableValueTemplateDirective } from './select-searchable-value-template.directive';

@Component({
    selector: 'select-searchable',
    templateUrl: './select-searchable.template.html',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => SelectSearchableComponent),
        multi: true
    }]
})
export class SelectSearchableComponent implements ControlValueAccessor, OnInit, OnDestroy, DoCheck {
    @HostBinding('class.select-searchable')
    private _cssClass = true;
    @HostBinding('class.select-searchable-ios')
    _isIos: boolean;
    @HostBinding('class.select-searchable-md')
    _isMD: boolean;
    @HostBinding('class.select-searchable-is-multiple')
    private get _isMultipleCssClass(): boolean {
        return this.isMultiple;
    }
    @HostBinding('class.select-searchable-has-value')
    private get _hasValueCssClass(): boolean {
        return this.hasValue();
    }
    @HostBinding('class.select-searchable-has-placeholder')
    private get _hasPlaceholderCssClass(): boolean {
        return this._hasPlaceholder;
    }
    private _isOnSearchEnabled = true;
    private _isEnabled = true;
    private _isOpened = false;
    private _valueItems: any[] = [];
    private _value: any = null;
    private _modal: Modal;
    private _itemsDiffer: IterableDiffer<any>;
    private _hasObjects: boolean;
    private _canClear = false;
    private _isMultiple = false;
    private _canAddItem = false;
    private _addItemObservable: Subscription;
    private _deleteItemObservable: Subscription;
    private onItemsChange: EventEmitter<any> = new EventEmitter();
    get _shouldStoreItemValue(): boolean {
        return this.shouldStoreItemValue && this._hasObjects;
    }
    _searchText = '';
    _hasSearchText = false;
    _groups: any[] = [];
    _itemsToConfirm: any[] = [];
    _selectedItems: any[] = [];
    _selectPageComponent: SelectSearchablePageComponent;
    _filteredGroups: any[] = [];
    _hasGroups: boolean;
    _isSearching: boolean;
    _labelText: string;
    _hasPlaceholder: boolean;
    _infiniteScroll: InfiniteScroll;
    _isAddItemTemplateVisible = false;
    _isFooterVisible = true;
    _itemToAdd: any = null;
    _footerButtonsCount = 0;
    get searchText(): string {
        return this._searchText;
    }
    get isSearching(): boolean {
        return this._isSearching;
    }
    get hasSearchText(): boolean {
        return this._hasSearchText;
    }
    get value(): any {
        return this._value;
    }
    set value(value: any) {
        this._value = value;

        // Set value items.
        this._valueItems.splice(0, this._valueItems.length);

        if (this.isMultiple) {
            if (value && value.length) {
                Array.prototype.push.apply(this._valueItems, value);
            }
        } else {
            if (!this._isNullOrWhiteSpace(value)) {
                this._valueItems.push(value);
            }
        }

        this._setIonItemHasValue();
        this._setHasPlaceholder();
    }
    @Input()
    items: any[] = [];
    @Output()
    itemsChange: EventEmitter<any> = new EventEmitter();
    @HostBinding('class.select-searchable-is-enabled')
    @Input('isEnabled')
    get isEnabled(): boolean {
        return this._isEnabled;
    }
    set isEnabled(isEnabled: boolean) {
        this._isEnabled = !!isEnabled;
        this.enableIonItem(this._isEnabled);
    }
    get isOpened(): boolean {
        return this._isOpened;
    }
    @Input('isOkButtonEnabled')
    isOkButtonEnabled = true;
    @Input()
    itemValueField: string;
    @Input()
    itemTextField: string;
    @Input()
    groupValueField: string;
    @Input()
    groupTextField: string;
    @Input()
    canSearch = false;
    @Input('isOnSearchEnabled')
    get isOnSearchEnabled(): boolean {
        return this._isOnSearchEnabled;
    }
    set isOnSearchEnabled(isOnSearchEnabled: boolean) {
        this._isOnSearchEnabled = !!isOnSearchEnabled;
    }
    @HostBinding('class.select-searchable-can-clear')
    @Input('canClear')
    get canClear(): boolean {
        return this._canClear;
    }
    set canClear(canClear: boolean) {
        this._canClear = !!canClear;
        this._countFooterButtons();
    }
    @Input()
    hasInfiniteScroll = false;
    @Input()
    hasVirtualScroll = false;
    @Input()
    virtualScrollApproxItemHeight = '40px';
    @Input()
    virtualScrollApproxItemWidth = '100%';
    @Input()
    virtualScrollBufferRatio = 3;
    @Input()
    virtualScrollHeaderFn = () => { return null; }
    @Input()
    searchPlaceholder: string;
    @Input()
    placeholder: string;
    @Input('isMultiple')
    get isMultiple(): boolean {
        return this._isMultiple;
    }
    set isMultiple(isMultiple: boolean) {
        this._isMultiple = !!isMultiple;
        this._countFooterButtons();
    }
    @Input()
    searchFailText = 'No items found.';
    @Input()
    clearButtonText = 'Clear';
    @Input()
    addButtonText = 'Add';
    @Input()
    okButtonText = 'OK';
    @Input()
    closeButtonText = 'Cancel';
    @Input()
    focusSearchbar = false;
    @Input()
    headerColor: string;
    @Input()
    groupColor: string;
    @Output()
    onChange: EventEmitter<any> = new EventEmitter();
    @Output()
    onSearch: EventEmitter<any> = new EventEmitter();
    @Output()
    onSearchFail: EventEmitter<any> = new EventEmitter();
    @Output()
    onSearchSuccess: EventEmitter<any> = new EventEmitter();
    @Output()
    onInfiniteScroll: EventEmitter<any> = new EventEmitter();
    @Output()
    onOpen: EventEmitter<any> = new EventEmitter();
    @Output()
    onClose: EventEmitter<any> = new EventEmitter();
    @ContentChild(SelectSearchableValueTemplateDirective, { read: TemplateRef })
    valueTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableItemTemplateDirective, { read: TemplateRef })
    itemTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableItemRightTemplateDirective, { read: TemplateRef })
    itemRightTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableTitleTemplateDirective, { read: TemplateRef })
    titleTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchablePlaceholderTemplateDirective, { read: TemplateRef })
    placeholderTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableMessageTemplateDirective, { read: TemplateRef })
    messageTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableGroupTemplateDirective, { read: TemplateRef })
    groupTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableGroupRightTemplateDirective, { read: TemplateRef })
    groupRightTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableCloseButtonTemplateDirective, { read: TemplateRef })
    closeButtonTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableSearchFailTemplateDirective, { read: TemplateRef })
    searchFailTemplate: TemplateRef<any>;
    @ContentChild(SelectSearchableAddItemTemplateDirective, { read: TemplateRef })
    addItemTemplate: TemplateRef<any>;
    get itemsToConfirm(): any[] {
        return this._itemsToConfirm;
    }
    @Input()
    searchDebounce: Number = 250;
    @Input()
    disabledItems: any[] = [];
    @Input()
    shouldStoreItemValue = false;
    @Input()
    canSaveItem = false;
    @Input()
    canDeleteItem = false;
    @Input('canAddItem')
    get canAddItem(): boolean {
        return this._canAddItem;
    }
    set canAddItem(canAddItem: boolean) {
        this._canAddItem = !!canAddItem;
        this._countFooterButtons();
    }
    @Output()
    onSaveItem: EventEmitter<any> = new EventEmitter();
    @Output()
    onDeleteItem: EventEmitter<any> = new EventEmitter();
    @Output()
    onAddItem: EventEmitter<any> = new EventEmitter();

    constructor(
        private _modalController: ModalController,
        private ionForm: Form,
        private _platform: Platform,
        @Optional() private ionItem: Item,
        private _iterableDiffers: IterableDiffers,
        private element: ElementRef
    ) {
        if (!this.items || !this.items.length) {
            this.items = [];
        }

        this._itemsDiffer = this._iterableDiffers.find(this.items).create();
    }

    initFocus() { }

    enableIonItem(isEnabled: boolean) {
        if (!this.ionItem) {
            return;
        }

        this.ionItem.setElementClass('item-input-disabled', !isEnabled);
    }

    @HostListener('click', ['$event'])
    _click(event: UIEvent) {
        if (!this.isEnabled || event.detail === 0) {
            // Don't continue if the click event came from a form submit.
            return;
        }

        this._labelText = this._getLabelText();
        event.preventDefault();
        event.stopPropagation();
        this.open().then(() => {
            this.onOpen.emit({
                component: this
            });
        });
    }

    _isNullOrWhiteSpace(value: any): boolean {
        if (value === null || value === undefined) {
            return true;
        }

        // Convert value to string in case if it's not.
        return value.toString().replace(/\s/g, '').length < 1;
    }

    _setHasSearchText() {
        this._hasSearchText = !this._isNullOrWhiteSpace(this._searchText);
    }

    _hasOnSearch(): boolean {
        return this.isOnSearchEnabled && this.onSearch.observers.length > 0;
    }

    _hasOnSaveItem(): boolean {
        return this.canSaveItem && this.onSaveItem.observers.length > 0;
    }

    _hasOnAddItem(): boolean {
        return this.canAddItem && this.onAddItem.observers.length > 0;
    }

    _hasOnDeleteItem(): boolean {
        return this.canDeleteItem && this.onDeleteItem.observers.length > 0;
    }

    _select(selectedItem: any) {
        this.value = selectedItem;
        this._emitValueChange();
    }

    _emitValueChange() {
        this.propagateOnChange(this.value);
        this._setIonItemValidityClasses();

        this.onChange.emit({
            component: this,
            value: this.value
        });
    }

    _emitSearch() {
        if (!this.canSearch) {
            return;
        }

        this.onSearch.emit({
            component: this,
            text: this._searchText
        });
    }

    _formatItem(item: any): string {
        if (this._isNullOrWhiteSpace(item)) {
            return null;
        }

        return this.itemTextField ? item[this.itemTextField] : item.toString();
    }

    _getLabelText(): string {
        let label = this.ionItem ? this.ionItem.getNativeElement().querySelector('ion-label') : null;
        return label ? label.textContent : null;
    }

    _getItemValue(item: any): any {
        if (!this._hasObjects) {
            return item;
        }

        return item[this.itemValueField];
    }

    _getStoredItemValue(item: any): any {
        if (!this._hasObjects) {
            return item;
        }

        return this._shouldStoreItemValue ? item : item[this.itemValueField];
    }

    _filterItems() {
        this._setHasSearchText();

        if (this._hasOnSearch()) {
            // Delegate filtering to the event.
            this._emitSearch();
        } else {
            // Default filtering.
            let groups = [];

            if (!this._searchText || !this._searchText.trim()) {
                groups = this._groups;
            } else {
                let filterText = this._searchText.trim().toLowerCase();

                this._groups.forEach(group => {
                    let items = group.items.filter(item => {
                        let itemText = (this.itemTextField ?
                            item[this.itemTextField] : item).toString().toLowerCase();
                        return itemText.indexOf(filterText) !== -1;
                    });

                    if (items.length) {
                        groups.push({
                            value: group.value,
                            text: group.text,
                            items: items
                        });
                    }
                });

                // No items found.
                if (!groups.length) {
                    groups.push({
                        items: []
                    });
                }
            }

            this._filteredGroups = groups;

            if (this._areGroupsEmpty(groups)) {
                this.onSearchFail.emit({
                    component: this,
                    text: this._searchText
                });
            } else {
                this.onSearchSuccess.emit({
                    component: this,
                    text: this._searchText
                });
            }
        }
    }

    _isItemDisabled(item: any): boolean {
        if (!this.disabledItems) {
            return;
        }

        return this.disabledItems.some(_item => {
            return this._getItemValue(_item) === this._getItemValue(item);
        });
    }

    _isItemSelected(item: any) {
        return this._selectedItems.find(selectedItem => {
            return this._getItemValue(item) === this._getStoredItemValue(selectedItem);
        }) !== undefined;
    }

    _addSelectedItem(item: any) {
        if (this._shouldStoreItemValue) {
            this._selectedItems.push(this._getItemValue(item));
        } else {
            this._selectedItems.push(item);
        }
    }

    _deleteSelectedItem(item: any) {
        let itemToDeleteIndex;

        this._selectedItems.forEach((selectedItem, itemIndex) => {
            if (
                this._getItemValue(item) ===
                this._getStoredItemValue(selectedItem)
            ) {
                itemToDeleteIndex = itemIndex;
            }
        });

        this._selectedItems.splice(itemToDeleteIndex, 1);
    }

    _saveItem(event: Event, item: any) {
        event.stopPropagation();
        this._itemToAdd = item;

        if (this._hasOnSaveItem()) {
            this.onSaveItem.emit({
                component: this,
                item: this._itemToAdd
            });
        } else {
            this.showAddItemTemplate();
        }
    }

    _deleteItemClick(event: Event, item: any) {
        event.stopPropagation();
        this._itemToAdd = item;

        if (this._hasOnDeleteItem()) {
            // Delegate logic to event.
            this.onDeleteItem.emit({
                component: this,
                item: this._itemToAdd
            });
        } else {
            this.deleteItem(this._itemToAdd);
        }
    }

    _addItemClick() {
        this._itemToAdd = null;

        if (this._hasOnAddItem()) {
            this.onAddItem.emit({
                component: this
            });
        } else {
            this.showAddItemTemplate();
        }
    }

    private _countFooterButtons() {
        let footerButtonsCount = 0;

        if (this.canClear) {
            footerButtonsCount++;
        }

        if (this.isMultiple) {
            footerButtonsCount++;
        }

        if (this.canAddItem) {
            footerButtonsCount++;
        }

        this._footerButtonsCount = footerButtonsCount;
    }

    private _areGroupsEmpty(groups) {
        return groups.length === 0 || groups.every(group => {
            return !group.items || group.items.length === 0;
        });
    }

    private _setItems(items: any[]) {
        // It's important to have an empty starting group with empty items (groups[0].items),
        // because we bind to it when using VirtualScroll.
        // See https://github.com/eakoriakin/ionic-select-searchable/issues/70.
        let groups: any[] = [{
            items: items || []
        }];

        if (items && items.length) {
            if (this._hasGroups) {
                groups = [];

                items.forEach(item => {
                    let groupValue = this._getPropertyValue(item, this.groupValueField),
                        group = groups.find(_group => _group.value === groupValue);

                    if (group) {
                        group.items.push(item);
                    } else {
                        groups.push({
                            value: groupValue,
                            text: this._getPropertyValue(item, this.groupTextField),
                            items: [item]
                        });
                    }
                });
            }
        }

        this._groups = groups;
        this._filteredGroups = this._groups;
    }

    private _formatValueItem(item: any): string {
        if (this._shouldStoreItemValue) {
            // Get item text from the list as we store it's value only.
            let selectedItem = this.items.find(_item => {
                return _item[this.itemValueField] === item;
            });

            return this._formatItem(selectedItem);
        } else {
            return this._formatItem(item);
        }
    }

    private _getPropertyValue(object: any, property: string): any {
        if (!property) {
            return null;
        }

        return property.split('.').reduce((_object, _property) => {
            return _object ? _object[_property] : null;
        }, object);
    }

    private _setIonItemHasFocus(hasFocus: boolean) {
        if (!this.ionItem) {
            return;
        }

        // Apply focus CSS class for proper stylying of ion-item/ion-label.
        this.ionItem.setElementClass('item-input-has-focus', hasFocus);
    }

    private _setIonItemHasValue() {
        if (!this.ionItem) {
            return;
        }

        // Apply value CSS class for proper stylying of ion-item/ion-label.
        this.ionItem.setElementClass('item-input-has-value', this.hasValue());
    }

    private _setHasPlaceholder() {
        this._hasPlaceholder = !this.hasValue() &&
            (!this._isNullOrWhiteSpace(this.placeholder) || this.placeholderTemplate) ?
            true : false;
    }

    private propagateOnChange = (_: any) => { };
    private propagateOnTouched = () => { };

    private _setIonItemValidityClasses() {
        if (!this.ionItem) {
            return;
        }

        // Use requestAnimationFrame() here as Ionic does.
        // This probably helps make animation smooth.
        // See https://github.com/rintoj/angular2-virtual-scroll/issues/33.
        requestAnimationFrame(() => {
            let classList = this.element.nativeElement.classList;
            this.ionItem.setElementClass('ng-invalid', false);
            this.ionItem.setElementClass('ng-valid', false);
            this.ionItem.setElementClass('ng-touched', false);
            this.ionItem.setElementClass('ng-untouched', false);
            this.ionItem.setElementClass('ng-dirty', false);
            this.ionItem.setElementClass('ng-pristine', false);

            classList.forEach((className: string) => {
                if (className === 'ng-invalid') {
                    this.ionItem.setElementClass('ng-invalid', true);
                }

                if (className === 'ng-valid') {
                    this.ionItem.setElementClass('ng-valid', true);
                }

                if (className === 'ng-touched') {
                    this.ionItem.setElementClass('ng-touched', true);
                }

                if (className === 'ng-untouched') {
                    this.ionItem.setElementClass('ng-untouched', true);
                }

                if (className === 'ng-dirty') {
                    this.ionItem.setElementClass('ng-dirty', true);
                }

                if (className === 'ng-pristine') {
                    this.ionItem.setElementClass('ng-pristine', true);
                }
            });
        });
    }

    private _toggleAddItemTemplate(isVisible: boolean) {
        // It should be possible to show/hide the template regardless
        // canAddItem or canSaveItem parameters, so we could implement some
        // custom behavior. E.g. adding item when search fails using onSearchFail event.
        if (!this.addItemTemplate) {
            return;
        }

        // To make SaveItemTemplate visible we just position it over list using CSS.
        // We don't hide list with *ngIf or [hidden] to prevent its scroll position.
        this._isAddItemTemplateVisible = isVisible;
        this._isFooterVisible = !isVisible;
    }

    /* ControlValueAccessor */
    writeValue(value: any) {
        this.value = value;
        this._setIonItemValidityClasses();
    }

    registerOnChange(fn: any): void {
        this.propagateOnChange = fn;
    }

    registerOnTouched(fn: () => void) {
        this.propagateOnTouched = fn;
    }

    setDisabledState(isDisabled: boolean) {
        this.isEnabled = !isDisabled;
        // We could have used _setIonItemValidityClasses() to update classes,
        // but shouldn't as it will remove ng-valid class and probably some other
        // ng classes, which will in turn break Ionic item highlighting styles.
    }
    /* .ControlValueAccessor */

    ngOnInit() {
        this._isIos = this._platform.is('ios');
        this._isMD = !this._isIos;
        this._hasObjects = !this._isNullOrWhiteSpace(this.itemValueField);
        // Grouping is supported for objects only.
        // Ionic VirtualScroll has it's own implementation of grouping.
        this._hasGroups = Boolean(this._hasObjects && this.groupValueField && !this.hasVirtualScroll);
        this.ionForm.register(this);

        if (this.ionItem) {
            this.ionItem.setElementClass('item-input', true);
            this.ionItem.setElementClass('item-select-searchable', true);
        }

        this.enableIonItem(this.isEnabled);
    }

    ngOnDestroy() {
        this.ionForm.deregister(this);
    }

    ngDoCheck() {
        let itemsChanges = this._itemsDiffer.diff(this.items);

        if (itemsChanges) {
            this._setItems(this.items);
            this.value = this.value;

            this.onItemsChange.emit({
                component: this
            });
        }
    }

    public addItem(item: any): Promise<any> {
        let self = this;

        // Adding item triggers onItemsChange.
        // Return a promise that resolves when onItemsChange finishes.
        // We need a promise os user could do something after item has been added,
        // e.g. use search() method to find the added item.
        this.items.unshift(item);

        // Close any running subscription.
        if (this._addItemObservable) {
            this._addItemObservable.unsubscribe();
        }

        return new Promise(function (resolve, reject) {
            // Complete callback isn't fired for some reason,
            // so unsubscribe in both success and fail cases.
            self._addItemObservable = self.onItemsChange.asObservable().subscribe(() => {
                self._addItemObservable.unsubscribe();
                resolve();
            }, () => {
                self._addItemObservable.unsubscribe();
                reject();
            });
        });
    }

    public deleteItem(item: any): Promise<any> {
        let self = this,
            hasValueChanged = false;

        // Remove deleted item from selected items.
        if (this._selectedItems) {
            this._selectedItems = this._selectedItems.filter(_item => {
                return this._getItemValue(item) !== this._getStoredItemValue(_item);
            });
        }

        // Remove deleted item from value.
        if (this.value) {
            if (this.isMultiple) {
                let values = this.value.filter(value => {
                    return value.id !== item.id;
                });

                if (values.length !== this.value.length) {
                    this.value = values;
                    hasValueChanged = true;
                }
            } else {
                if (item === this.value) {
                    this.value = null;
                    hasValueChanged = true;
                }
            }
        }

        if (hasValueChanged) {
            this._emitValueChange();
        }

        // Remove deleted item from list.
        let items = this.items.filter(_item => {
            return _item.id !== item.id;
        });

        // Refresh items on parent component.
        this.itemsChange.emit(items);

        // Refresh list.
        this._setItems(items);

        this.onItemsChange.emit({
            component: this
        });

        // Close any running subscription.
        if (this._deleteItemObservable) {
            this._deleteItemObservable.unsubscribe();
        }

        return new Promise(function (resolve, reject) {
            // Complete callback isn't fired for some reason,
            // so unsubscribe in both success and fail cases.
            self._deleteItemObservable = self.onItemsChange.asObservable().subscribe(() => {
                self._deleteItemObservable.unsubscribe();
                resolve();
            }, () => {
                self._deleteItemObservable.unsubscribe();
                reject();
            });
        });
    }

    public hasValue(): boolean {
        if (this.isMultiple) {
            return this._valueItems.length !== 0;
        } else {
            return this._valueItems.length !== 0 && !this._isNullOrWhiteSpace(this._valueItems[0]);
        }
    }

    public open(): Promise<any> {
        let self = this;

        return new Promise(function (resolve, reject) {
            if (!self._isEnabled || self._isOpened) {
                reject('SelectSearchable is disabled or already opened.');
                return;
            }

            self._filterItems();

            self._isOpened = true;
            self._modal = self._modalController.create(SelectSearchablePageComponent, {
                selectComponent: self
            });
            self._modal.present().then(() => {
                // Set focus after page has opened to avoid flickering of focus highlighting
                // before page opening.
                self._setIonItemHasFocus(true);
                resolve();
            });
            self._modal.onWillDismiss(() => {
                self._setIonItemHasFocus(false);
            });
            self._modal.onDidDismiss((data, role) => {
                self._isOpened = false;

                if (self.isMultiple) {
                    self._itemsToConfirm = [];
                }

                // Closed by clicking on backdrop outside modal.
                if (role === 'backdrop') {
                    self.onClose.emit({
                        component: self
                    });
                }
            });
        });
    }

    public close(): Promise<any> {
        let self = this;

        return new Promise(function (resolve, reject) {
            if (!self._isEnabled || !self._isOpened) {
                reject('SelectSearchable is disabled or already closed.');
                return;
            }

            self.propagateOnTouched();
            self._setIonItemValidityClasses();

            // Delete old instance of infinite scroll, to avoid "Cannot read property 'enableEvents' of null"
            // error from it when page is opened next time.
            self._infiniteScroll = null;
            self._isOpened = false;
            self._itemToAdd = null;
            self._modal.dismiss().then(() => {
                self._setIonItemHasFocus(false);
                self.hideAddItemTemplate();
                resolve();
            });
        });
    }

    public clear() {
        this.value = this.isMultiple ? [] : null;

        if (this.isMultiple) {
            this._itemsToConfirm = [];
        }

        this.propagateOnChange(this.value);
        this._setIonItemValidityClasses();
    }

    public scrollToTop(): Promise<any> {
        let self = this;

        return new Promise(function (resolve, reject) {
            if (!self._isOpened) {
                reject('SelectSearchable content cannot be scrolled.');
                return;
            }

            self._selectPageComponent._content.scrollToTop().then(() => {
                resolve();
            });
        });
    }

    public scrollToBottom(): Promise<any> {
        let self = this;

        return new Promise(function (resolve, reject) {
            if (!self._isOpened) {
                reject('SelectSearchable content cannot be scrolled.');
                return;
            }

            self._selectPageComponent._content.scrollToBottom().then(() => {
                resolve();
            });
        });
    }

    public startSearch() {
        if (!this._isEnabled) {
            return;
        }

        this.showLoading();
    }

    public endSearch() {
        if (!this._isEnabled) {
            return;
        }

        this.hideLoading();

        // When inside Ionic Modal and onSearch event is used,
        // ngDoCheck() doesn't work as _itemsDiffer fails to detect changes.
        // See https://github.com/eakoriakin/ionic-select-searchable/issues/44.
        // Refresh items manually.
        this._setItems(this.items);

        if (this._areGroupsEmpty(this._filteredGroups)) {
            this.onSearchFail.emit({
                component: this,
                text: this._searchText
            });
        } else {
            this.onSearchSuccess.emit({
                component: this,
                text: this._searchText
            });
        }
    }

    public enableInfiniteScroll() {
        if (!this._isEnabled || !this._infiniteScroll) {
            return;
        }

        this._infiniteScroll.enable(true);
    }

    public disableInfiniteScroll() {
        if (!this._isEnabled || !this._infiniteScroll) {
            return;
        }

        this._infiniteScroll.enable(false);
    }

    public endInfiniteScroll() {
        if (!this._isEnabled || !this._infiniteScroll) {
            return;
        }

        this._infiniteScroll.complete();
        this._setItems(this.items);
    }

    public search(text: string) {
        if (!this._isEnabled || !this._isOpened || !this.canSearch) {
            return;
        }

        this._searchText = text;
        this._setHasSearchText();
        this._filterItems();
    }

    public showLoading() {
        if (!this._isEnabled) {
            return;
        }

        this._isSearching = true;
    }

    public hideLoading() {
        if (!this._isEnabled) {
            return;
        }

        this._isSearching = false;
    }

    public showAddItemTemplate() {
        this._toggleAddItemTemplate(true);
    }

    public hideAddItemTemplate() {
        this._toggleAddItemTemplate(false);
    }
}
