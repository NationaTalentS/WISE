import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, tap } from "rxjs/operators";
import { of } from "rxjs/observable/of";
import { Project } from "./project";

@Injectable()
export class TeacherService {

  private projectsUrl = 'api/teacher/projects';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<Project[]> {
    const headers = new HttpHeaders({ 'Cache-Control': 'no-cache' });
    return this.http.get<Project[]>(this.projectsUrl, { headers: headers })
      .pipe(
        tap(runs => this.log(`fetched projects`)),
        catchError(this.handleError('getProjects', []))
      );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      this.log(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  private log(message: string) {
    console.log('TeacherService: ' + message);
  }


}
