<?php

namespace Everest\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Everest\Http\Controllers\Controller;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class BaseController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();

        // Ensure only admins can access this panel
        if (!$user || !$user->root_admin) {
            throw new AccessDeniedHttpException('You do not have permission to access this area.');
        }

        return view('templates/base.core');
    }
}
