import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductsComponent } from './products/products.component';
import { UsersComponent } from './users/users.component';
import { ClientsComponent } from './clients/clients.component';
import { SalesComponent } from './sales/sales.component';
import { OrdersComponent } from './orders/orders.component';
import { DomainLogsComponent } from './domain-logs/domain-logs.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    ProductsComponent, 
    UsersComponent,
    ClientsComponent,
    SalesComponent,
    OrdersComponent,
    DomainLogsComponent
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
