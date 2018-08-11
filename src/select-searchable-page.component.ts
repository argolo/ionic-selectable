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
    @HostBinding('class.select-searchable-page-can-clear')
    private get _canClearCssClass(): boolean {
        return this.selectComponent.canClear;
    }
    @HostBinding('class.select-searchable-page-is-multiple')
    private get _isMultipleCssClass(): boolean {
        return this.selectComponent.isMultiple;
    }
    @HostBinding('class.select-searchable-page-is-searching')
    private get _isSearchingCssClass(): boolean {
        return this.selectComponent._isSearching;
    }
    @HostBinding('class.select-searchable-page-is-add-item-template-visible')
    private get _isAddItemTemplateVisibleCssClass(): boolean {
        return this.selectComponent._isAddItemTemplateVisible;
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
    @ViewChild(Content)
    _content: Content;
    selectComponent: SelectSearchableComponent;

    constructor(
        private navParams: NavParams,
        private viewController: ViewController
    ) {
        this.selectComponent = this.navParams.get('selectComponent');
        this.selectComponent._selectPageComponent = this;
        this.selectComponent._selectedItems = [];

        if (!this.selectComponent._isNullOrWhiteSpace(this.selectComponent.value)) {
            if (this.selectComponent.isMultiple) {
                this.selectComponent.value.forEach(item => {
                    this.selectComponent._selectedItems.push(item);
                });
            } else {
                this.selectComponent._selectedItems.push(this.selectComponent.value);
            }
        }

        this._setItemsToConfirm(this.selectComponent._selectedItems);
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

    _getMoreItems(infiniteScroll: InfiniteScroll) {
        // TODO: Try to get infiniteScroll via ViewChild. Maybe it works in a newer Ionic version.
        // For now assign it here.
        this.selectComponent._infiniteScroll = infiniteScroll;

        this.selectComponent.onInfiniteScroll.emit({
            component: this.selectComponent,
            text: this.selectComponent._searchText
        });
    }

    _select(item: any) {
        if (this.selectComponent.isMultiple) {
            if (this.selectComponent._isItemSelected(item)) {
                this.selectComponent._deleteSelectedItem(item);
            } else {
                this.selectComponent._addSelectedItem(item);
            }

            this._setItemsToConfirm(this.selectComponent._selectedItems);
        } else {
            if (!this.selectComponent._isItemSelected(item)) {
                this.selectComponent._selectedItems = [];
                this.selectComponent._addSelectedItem(item);

                if (this.selectComponent._shouldStoreItemValue) {
                    this.selectComponent._select(this.selectComponent._getItemValue(item));
                } else {
                    this.selectComponent._select(item);
                }
            }

            this._close();
        }
    }

    _ok() {
        this.selectComponent._select(this.selectComponent._selectedItems);
        this._close();
    }

    _close() {
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

            if (!this.selectComponent._hasOnSearch()) {
                this.selectComponent._searchText = '';
                this.selectComponent._setHasSearchText();
            }
        });
    }

    _clear() {
        this.selectComponent.clear();
        this.selectComponent._emitValueChange();
        this.selectComponent.close().then(() => {
            this.selectComponent.onClose.emit({
                component: this.selectComponent
            });
        });
    }
}
