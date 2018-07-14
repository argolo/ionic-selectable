import { AfterViewInit, Component, HostBinding, ViewChild } from '@angular/core';
import { Content, InfiniteScroll, NavParams, Searchbar, ViewController } from 'ionic-angular';
import { SelectSearchableComponent } from './select-searchable.component';

@Component({
    selector: 'select-searchable-page',
    templateUrl: './select-searchable-page.template.html'
})
export class SelectSearchablePageComponent implements AfterViewInit {
    @HostBinding('class.select-searchable-page')
    private _cssClass = true;
    @HostBinding('class.select-searchable-page-can-reset')
    private get _canResetCssClass(): boolean {
        return this.selectComponent.canReset;
    }
    @HostBinding('class.select-searchable-page-is-multiple')
    private get _isMultipleCssClass(): boolean {
        return this.selectComponent.isMultiple;
    }
    @HostBinding('class.select-searchable-page-is-searching')
    private get _isSearchingCssClass(): boolean {
        return this.selectComponent._isSearching;
    }
    @HostBinding('class.select-searchable-page-ios')
    private get _isIos(): boolean {
        return this.selectComponent._isIos;
    }
    @HostBinding('class.select-searchable-page-md')
    private _isMD(): boolean {
        return this.selectComponent._isMD;
    }
    @ViewChild('searchbarComponent')
    private _searchbarComponent: Searchbar;
    private _selectedItems: any[] = [];
    @ViewChild(Content)
    _content: Content;
    _infiniteScroll: InfiniteScroll;
    selectComponent: SelectSearchableComponent;

    constructor(
        private navParams: NavParams,
        private viewController: ViewController
    ) {
        this.selectComponent = this.navParams.get('selectComponent');
        this.selectComponent._selectPageComponent = this;

        if (!this.selectComponent._isNullOrWhiteSpace(this.selectComponent.value)) {
            if (this.selectComponent.isMultiple) {
                this.selectComponent.value.forEach(item => {
                    this._selectedItems.push(item);
                });
            } else {
                this._selectedItems.push(this.selectComponent.value);
            }
        }

        this._setItemsToConfirm(this._selectedItems);
    }

    ngAfterViewInit() {
        if (this._searchbarComponent && this.selectComponent.focusSearchbar) {
            // Focus after a delay because focus doesn't work without it.
            setTimeout(() => {
                this._searchbarComponent.setFocus();
            }, 1000);
        }
    }

    private _setItemsToConfirm(items: any[]) {
        // Return a copy of original array, so it couldn't be changed from outside.
        this.selectComponent._itemsToConfirm = [].concat(items);
    }

    private _isItemDisabled(item: any): boolean {
        if (!this.selectComponent.disabledItems) {
            return;
        }

        return this.selectComponent.disabledItems.some(_item => {
            return this.selectComponent._getItemValue(_item) === this.selectComponent._getItemValue(item);
        });
    }

    private _isItemSelected(item: any) {
        return this._selectedItems.find(selectedItem => {
            return this.selectComponent._getItemValue(item) ===
                this.selectComponent._getStoredItemValue(selectedItem);
        }) !== undefined;
    }

    private _deleteSelectedItem(item: any) {
        let itemToDeleteIndex;

        this._selectedItems.forEach((selectedItem, itemIndex) => {
            if (
                this.selectComponent._getItemValue(item) ===
                this.selectComponent._getStoredItemValue(selectedItem)
            ) {
                itemToDeleteIndex = itemIndex;
            }
        });

        this._selectedItems.splice(itemToDeleteIndex, 1);
    }

    private _addSelectedItem(item: any) {
        if (this.selectComponent._shouldStoreItemValue) {
            this._selectedItems.push(this.selectComponent._getItemValue(item));
        } else {
            this._selectedItems.push(item);
        }
    }

    private _getMoreItems(infiniteScroll: InfiniteScroll) {
        // TODO: Try to get infiniteScroll via ViewChild. Maybe it works in a newer Ionic version.
        // For now assign it here.
        this._infiniteScroll = infiniteScroll;

        this.selectComponent.onInfiniteScroll.emit({
            component: this.selectComponent,
            infiniteScroll: infiniteScroll,
            text: this.selectComponent._filterText
        });
    }

    private _select(item: any) {
        if (this.selectComponent.isMultiple) {
            if (this._isItemSelected(item)) {
                this._deleteSelectedItem(item);
            } else {
                this._addSelectedItem(item);
            }

            this._setItemsToConfirm(this._selectedItems);
        } else {
            if (!this._isItemSelected(item)) {
                this._selectedItems = [];
                this._addSelectedItem(item);

                if (this.selectComponent._shouldStoreItemValue) {
                    this.selectComponent._select(this.selectComponent._getItemValue(item));
                } else {
                    this.selectComponent._select(item);
                }
            }

            this._close();
        }
    }

    private _ok() {
        this.selectComponent._select(this._selectedItems);
        this._close();
    }

    private _close() {
        // Focused input interferes with the animation.
        // Blur it first, wait a bit and then close the page.
        if (this._searchbarComponent) {
            this._searchbarComponent._fireBlur();
        }

        setTimeout(() => {
            this.selectComponent.close().then(() => {
                this.selectComponent.onClose.emit({
                    component: this.selectComponent
                });
            });

            if (!this.selectComponent._hasSearch()) {
                this.selectComponent._filterText = '';
            }
        });
    }

    private _reset() {
        this.selectComponent.reset();
        this.selectComponent._emitChange();
        this.selectComponent.close().then(() => {
            this.selectComponent.onClose.emit({
                component: this.selectComponent
            });
        });
    }
}
