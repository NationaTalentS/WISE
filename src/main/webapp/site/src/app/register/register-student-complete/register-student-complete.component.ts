import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-register-student-complete',
  templateUrl: './register-student-complete.component.html',
  styleUrls: ['./register-student-complete.component.scss']
})
export class RegisterStudentCompleteComponent implements OnInit {

  username: string;

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.username = params['username'];
    });
  }

}
