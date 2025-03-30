<?php

namespace Everest\Http\Controllers\Api\Application\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Everest\Contracts\Repository\SettingsRepositoryInterface;
use Everest\Http\Controllers\Api\Application\ApplicationApiController;

class ModuleController extends ApplicationApiController
{
    /**
     * ModuleController constructor.
     */
    public function __construct(
        private SettingsRepositoryInterface $settings
    ) {
        parent::__construct();
    }

    /**
     * Enable a new module on the panel.
     *
     * @throws \Throwable
     */
    public function enable(Request $request): Response
    {
        $this->settings->set('settings::modules:auth:' . $request->all()[0] . ':enabled', true);

        return $this->returnNoContent();
    }

    /**
     * Disable a module on the panel.
     *
     * @throws \Throwable
     */
    public function disable(Request $request): Response
    {
        $this->settings->set('settings::modules:auth:' . $request->all()[0] . ':enabled', false);

        return $this->returnNoContent();
    }

    /**
     * Update the module settings in the Panel.
     * Currently, it is only possible to update one value at once.
     *
     * @throws \Throwable
     */
    public function update(Request $request): Response
    {
        $this->settings->set(
            'settings::modules:auth:' . $request->input('module') . ':' . $request->input('key'),
            $request->input('value')
        );

        return $this->returnNoContent();
    }
}
