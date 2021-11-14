import {
  Component,
  ContentChild,
  Input,
  OnInit,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { BreadcrumbItemDirective } from './breadcrumb-item.directive';
import { BreadcrumbDefinition, BreadcrumbService } from './breadcrumb.service';

@Component({
  selector: 'xng-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BreadcrumbComponent implements OnInit {
  subscription: Subscription;
  breadcrumbs$: Observable<BreadcrumbDefinition[]>;
  separatorTemplate: TemplateRef<void>;
  private _separator = '/';

  /**
   * Breadcrumb item can be customized with this template
   * Template context is provided label, additional info, first and last indexes
   * Use cases:
   * 1) Add an icon along with label
   * 2) i18n. {{breadcrumb | translate}} or {{breadcrumb | transloco}}
   * 3) Change text case {{breadcrumb | titlecase}}
   */
  @ContentChild(BreadcrumbItemDirective, { static: false, read: TemplateRef })
  itemTemplate;

  /**
   * If true, breadcrumb is auto generated even without any mapping label
   * Default label is same as route segment
   */
  @Input() autoGenerate = true;

  /**
   * By default query params will be preserved with breadcrumbs
   */
  @Input() preserveQueryParams = true;

  /**
   * By default query fragments will be preserved with breadcrumbs
   */
  @Input() preserveFragment = true;

  /**
   * custom class provided by consumer to increase specificity
   * This will benefit to override styles that are conflicting
   */
  @Input() class = '';

  /**
   * anchorTarget = "_blank" makes the breadcrumb link open in a new tab
   */
  @Input() anchorTarget: '_blank' | undefined;

  /**
   * separator between breadcrumbs, defaults to '/'.
   * User can customize separator either by passing a String or Template
   *
   * String --> Ex: <xng-breadcrumb separator="-"> </xng-breadcrumb>
   *
   * Template --> Ex: <xng-breadcrumb [separator]="separatorTemplate"> </xng-breadcrumb>
   * <ng-template #separatorTemplate><mat-icon>arrow_right</mat-icon></ng-template>
   */
  @Input('separator')
  set separator(value: string | TemplateRef<void>) {
    if (value instanceof TemplateRef) {
      this.separatorTemplate = value;
      this._separator = undefined;
    } else {
      this.separatorTemplate = undefined;
      this._separator = value || '/';
    }
  }
  get separator() {
    return this._separator;
  }

  setupMessage = 'not set up yet';
  someParameterValue = null;

  constructor(
    private breadcrumbService: BreadcrumbService,
    activateRoute: ActivatedRoute
  ) {
    activateRoute.params.subscribe((params) => {
      this.setupComponent(params['someParam']);
    });
  }

  setupComponent(someParam) {
    this.setupMessage = 'set up at ' + new Date();
    this.someParameterValue = someParam;
  }

  ngOnInit() {
    this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$.pipe(
      map((breadcrumbs: BreadcrumbDefinition[]) => {
        return breadcrumbs
          .filter((breadcrumb: BreadcrumbDefinition) => {
            // Usually, breadcrumb list can contain a combination of auto generated and user specified labels
            // this filters autogenerated labels in case of "[autoGenerate]: false"
            if (this.autoGenerate) {
              return true;
            }
            return !breadcrumb.isAutoGeneratedLabel;
          })
          .map((breadcrumb: BreadcrumbDefinition) => {
            // Do not mutate breadcrumb as its source of truth.
            // There can be scenarios where we can have multiple xng-breadcrumb instances in page
            const { routeInterceptor, routeLink } = breadcrumb;
            return {
              ...breadcrumb,
              routeLink: routeInterceptor?.(routeLink, breadcrumb) || routeLink,
            };
          });
      })
    );
  }
}
