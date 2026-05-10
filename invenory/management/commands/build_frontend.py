import subprocess
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Build the React frontend for production serving'

    def handle(self, *args, **options):
        frontend_dir = settings.BASE_DIR / 'frontend'
        self.stdout.write('Building React frontend...')
        result = subprocess.run(
            ['npm', 'run', 'build'],
            cwd=str(frontend_dir),
            shell=True
        )
        if result.returncode == 0:
            self.stdout.write(self.style.SUCCESS('Frontend build successful. Run python manage.py runserver to serve the app.'))
        else:
            self.stdout.write(self.style.ERROR('Frontend build failed. Check npm output above.'))
